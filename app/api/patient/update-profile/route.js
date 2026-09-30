import { NextResponse } from "next/server";
import { tryConnectToDatabase } from "../../../../lib/mongodb";
import { updateUserProfile, updateUserHealthMetrics } from "../../../../lib/static-data";
import { getAuthUser } from "../../../../lib/jwt";
import { ObjectId } from "mongodb";

export async function POST(request) {
  try {
    // Verify authentication; the profile being updated is always the caller's own
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const userId = authUser.id;

    // Parse the request body
    const profileData = await request.json();

    // Validate required fields
    if (!profileData || typeof profileData !== "object") {
      return NextResponse.json(
        { error: "Profile data is required" },
        { status: 400 }
      );
    }

    const conn = await tryConnectToDatabase();

    // Clean up the profile data to remove any sensitive or unnecessary fields
    const sanitizedProfileData = {
      // Basic Information
      name: profileData.name,
      phone: profileData.phone,
      // Medical Information
      dateOfBirth: profileData.dateOfBirth,
      gender: profileData.gender,
      bloodType: profileData.bloodType,
      allergies: profileData.allergies,
      medicalConditions: profileData.medicalConditions,
      medications: profileData.medications,
      // Update timestamp
      updatedAt: new Date(),
    };

    // Separate out health metrics data
    const healthMetricsData = {
      height: profileData.height || null,
      weight: profileData.weight || null,
      bloodPressure: profileData.bloodPressure || null,
      heartRate: profileData.heartRate || null,
      glucoseLevel: profileData.glucoseLevel || null,
      // Calculate BMI if both height and weight are provided
      ...(profileData.height && profileData.weight
        ? {
            bmi:
              Math.round(
                (profileData.weight / Math.pow(profileData.height / 100, 2)) *
                  10
              ) / 10,
          }
        : {}),
      timestamp: new Date(),
    };

    // Add BMI status if BMI is calculated
    if (healthMetricsData.bmi) {
      const bmi = healthMetricsData.bmi;
      if (bmi < 18.5) {
        healthMetricsData.bmiStatus = "Underweight";
      } else if (bmi < 25) {
        healthMetricsData.bmiStatus = "Normal weight";
      } else if (bmi < 30) {
        healthMetricsData.bmiStatus = "Overweight";
      } else {
        healthMetricsData.bmiStatus = "Obese";
      }
    }

    // Static fallback when MongoDB is unavailable
    if (!conn) {
      const nameParts = (sanitizedProfileData.name || "").trim().split(/s+/).filter(Boolean);
      const profileUpdate = Object.fromEntries(
        Object.entries({
          firstName: nameParts[0],
          lastName: nameParts.slice(1).join(" ") || undefined,
          phone: sanitizedProfileData.phone,
          dateOfBirth: sanitizedProfileData.dateOfBirth,
          gender: sanitizedProfileData.gender,
          bloodType: sanitizedProfileData.bloodType,
          allergies: sanitizedProfileData.allergies,
          medicalConditions: sanitizedProfileData.medicalConditions,
          medications: sanitizedProfileData.medications,
        }).filter(([, v]) => v !== undefined && v !== "")
      );
      const staticUser = updateUserProfile(userId, profileUpdate);
      if (!staticUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      const { timestamp, ...metricFields } = healthMetricsData;
      const storedMetrics = updateUserHealthMetrics(userId, metricFields);
      const { password, resetToken, resetTokenExpiry, ...safeUser } = staticUser;
      return NextResponse.json({
        success: true,
        fallback: true,
        message: "Profile updated successfully",
        user: safeUser,
        healthMetrics: storedMetrics.current || null,
      });
    }
    const { db } = conn;

    // Find the user record by the identity in the token only (never by body fields)
    const userObjectId = ObjectId.isValid(userId) ? new ObjectId(userId) : null;
    let mainUser = null;
    if (userObjectId) {
      mainUser = await db.collection("users").findOne({ _id: userObjectId });
    }
    if (!mainUser) {
      mainUser = await db.collection("users").findOne({ userId: userId });
    }
    if (!mainUser) {
      mainUser = await db.collection("users").findOne({ _id: userId });
    }

    // Accounts from the static fallback store have no database record yet; create one
    if (!mainUser) {
      const newUser = {
        _id: userObjectId || new ObjectId(),
        userId: userId,
        firstName: profileData.name ? profileData.name.split(" ")[0] : "User",
        lastName: profileData.name
          ? profileData.name.split(" ").slice(1).join(" ")
          : "",
        email: authUser.email,
        userType: authUser.type || "patient",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const insertResult = await db.collection("users").insertOne(newUser);
      if (!insertResult.acknowledged) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      mainUser = newUser;
    }

    // 1. Update main user profile
    // Update firstName and lastName if name is provided
    if (sanitizedProfileData.name) {
      const nameParts = sanitizedProfileData.name.split(" ");
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(" ");

      await db.collection("users").updateOne(
        { _id: mainUser._id },
        {
          $set: {
            firstName: firstName,
            lastName: lastName || "",
            phone: sanitizedProfileData.phone || mainUser.phone,
            updatedAt: new Date(),
          },
        }
      );
    }

    // 2. Find or create user profile in medisynix.users (used by the Personal AI Doctor)
    const medisynixDb = db.client.db("medisynix");
    const medisynixUser = await medisynixDb
      .collection("users")
      .findOne({ userId: userId });

    // Prepare health data from profile
    const healthData = {
      age:
        profileData.age ||
        getAgeFromDateOfBirth(sanitizedProfileData.dateOfBirth) ||
        null,
      gender: sanitizedProfileData.gender || null,
      bloodType: sanitizedProfileData.bloodType || null,
      conditions: toList(sanitizedProfileData.medicalConditions),
      medications: toList(sanitizedProfileData.medications),
      allergies: toList(sanitizedProfileData.allergies),
      height: healthMetricsData.height,
      weight: healthMetricsData.weight,
      bloodPressure: healthMetricsData.bloodPressure,
      heartRate: healthMetricsData.heartRate,
      glucoseLevel: healthMetricsData.glucoseLevel,
      updatedAt: new Date(),
    };

    if (medisynixUser) {
      await medisynixDb
        .collection("users")
        .updateOne({ userId: userId }, { $set: { healthData: healthData } });
    } else {
      await medisynixDb.collection("users").insertOne({
        userId: userId,
        healthData: healthData,
        chatHistory: [],
        createdAt: new Date(),
      });
    }

    // 3. Insert health metrics in healthmetrics collection
    healthMetricsData.userId = userId;
    await db.collection("healthmetrics").insertOne(healthMetricsData);

    // Get the updated user data
    const updatedUser = await db
      .collection("users")
      .findOne({ _id: mainUser._id });

    // Get latest health metrics
    const latestHealthMetrics = await db
      .collection("healthmetrics")
      .find({ userId: userId })
      .sort({ timestamp: -1 })
      .limit(1)
      .toArray();

    // Remove sensitive information before returning
    if (updatedUser) {
      delete updatedUser.password;
      delete updatedUser.resetToken;
      delete updatedUser.resetTokenExpiry;
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
      healthMetrics:
        latestHealthMetrics.length > 0 ? latestHealthMetrics[0] : null,
    });
  } catch (error) {
    console.error("Error updating profile:", error.message);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

// Accept either a single string or an array for list-like medical fields
function toList(value) {
  if (!value) return [];
  return typeof value === "string" ? [value] : value;
}

// Helper function to calculate age from date of birth
function getAgeFromDateOfBirth(dateOfBirth) {
  if (!dateOfBirth) return null;

  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDifference = today.getMonth() - dob.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < dob.getDate())
  ) {
    age--;
  }

  return age;
}
