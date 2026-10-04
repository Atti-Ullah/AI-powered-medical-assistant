import AuthShell from "../../components/AuthShell";
import RegisterForm from "../../components/RegisterForm";

export const metadata = {
  title: "Create Account - Medisynix",
  description: "Create a new Medisynix account",
};

export default function RegisterPage() {
  return (
    <AuthShell
      title="Take control of your health journey."
      description="Create a free patient account to talk to the Medisynix assistant, book appointments and keep your records together."
    >
      <RegisterForm />
    </AuthShell>
  );
}
