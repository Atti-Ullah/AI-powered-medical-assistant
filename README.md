# 🏥 Medisynix — AI-Powered Medical Assistant

**Medisynix** is an AI-powered medical assistance platform developed as a **Final Year Project (FYP)**. The system is designed to help patients access healthcare-related information, interact with an AI medical assistant, manage their medical information, and access hospital-related guidance through a user-friendly web application.

The platform combines a modern web application architecture with an AI chatbot powered by **Chatbase**, with the chatbot specifically designed around information related to **Aga Khan University Hospital (AKUH)** and **Al Shifa Hospital**.

> **Note:** Medisynix is an academic/software project intended to provide informational assistance. It does not replace professional medical diagnosis, treatment, or consultation with a qualified healthcare professional.

---

## 🚀 Key Features

### 🤖 AI Medical Assistant

Medisynix provides an interactive AI chatbot that allows users to ask healthcare-related questions and receive informational responses.

The chatbot is powered by **Chatbase** and is configured specifically for:

* 🏥 Aga Khan University Hospital (AKUH)
* 🏥 Al Shifa Hospital

The chatbot is intended to help users obtain relevant hospital and healthcare information through a conversational interface.

### 👤 Patient Management

The platform provides functionality for patients to:

* Create and manage accounts
* Log in securely
* Manage personal information
* Access their medical-related information
* Interact with the medical assistance features

### 👨‍⚕️ Doctor & Patient Platform

The system is designed to support interaction between different healthcare-related users and provide dedicated functionality for patients and healthcare professionals.

### 🗄️ MongoDB Database

**MongoDB** is used for persistent data storage, including application and user-related information.

### 🔐 Authentication

The application includes user authentication and authorization functionality for controlling access to protected areas of the platform.

### 📊 Medical Information Management

The system provides functionality for managing and accessing relevant medical information through the application.

### 🌐 Modern Web Interface

The frontend is designed as a responsive web application with a focus on usability, accessibility, and a clean healthcare-oriented interface.

---

## 🧠 AI Chatbot Architecture

The AI chatbot is implemented using **Chatbase** rather than a directly integrated Gemini API.

### Chatbot Knowledge Scope

The current chatbot focuses on information related to:

**1. Aga Khan University Hospital (AKUH)**
Information and guidance related to the hospital and its available healthcare services.

**2. Al Shifa Hospital**
Information and guidance related to the hospital and its available healthcare services.

The chatbot can be integrated into the Medisynix web application to provide users with a conversational way to access this information.

> The chatbot's responses depend on the knowledge and configuration provided through Chatbase.

---

## 🛠️ Technology Stack

### Frontend

* **Next.js**
* **React.js**
* **JavaScript / TypeScript**
* **Tailwind CSS**
* HTML5
* CSS3

### Backend

* **Next.js API Routes**
* **Node.js**
* **Express.js** where applicable

### Database

* **MongoDB**
* **Mongoose**

### AI / Chatbot

* **Chatbase**

### Development & Deployment

* **Git**
* **GitHub**
* **Vercel**
* **npm**

---

## 📁 Project Structure

```text
AI-powered-medical-assistant/
│
├── app/                    # Next.js application
├── auth/                   # Authentication and backend functionality
├── components/             # Reusable React components
├── contexts/               # React contexts and application state
├── data/                   # Application data
├── lib/                    # Database and utility functions
├── models/                 # MongoDB/Mongoose models
├── pages/
│   └── api/                # API endpoints
├── public/                 # Static assets
├── scripts/                # Utility and project scripts
├── styles/                 # Global and application styles
│
├── next.config.js          # Next.js configuration
├── package.json            # Project dependencies and scripts
├── tailwind.config.js      # Tailwind CSS configuration
├── vercel.json             # Vercel configuration
└── README.md               # Project documentation
```

---

## ⚙️ Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Atti-Ullah/AI-powered-medical-assistant-.git
```

### 2. Navigate to the Project

```bash
cd AI-powered-medical-assistant-
```

### 3. Install Dependencies

```bash
npm install
```

If the project requires legacy peer-dependency resolution:

```bash
npm install --legacy-peer-deps
```

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory and configure the required environment variables.

Example:

```env
MONGODB_URI=your_mongodb_connection_string
DB_NAME=your_database_name
```

> Never commit `.env.local`, database credentials, API keys, or other secrets to GitHub.

### 5. Start the Development Server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## 🔒 Security & Privacy

Because Medisynix is a healthcare-related application, security and privacy are important considerations.

The project aims to:

* Protect authenticated user areas
* Secure database credentials through environment variables
* Avoid exposing sensitive configuration
* Restrict access to protected functionality
* Follow secure development practices

For production deployment, additional security, privacy, compliance, and clinical validation would be required.

---

## ⚠️ Medical Disclaimer

Medisynix is an **academic software project** and should not be considered a medical diagnostic system.

Information provided by the application or chatbot is intended for general informational purposes only.

Users should:

* Consult qualified healthcare professionals for medical decisions.
* Contact appropriate medical services in emergencies.
* Not rely solely on AI-generated information for diagnosis or treatment.
* Verify important healthcare information directly with the relevant hospital or healthcare professional.

---

## 🎓 Final Year Project

**Project:** Medisynix — AI-Powered Medical Assistant

**Type:** Final Year Project (FYP)

**Domain:** Software Engineering / Artificial Intelligence / Healthcare Technology

The project explores how modern web technologies and conversational AI can be used to improve access to healthcare-related information and provide a more convenient digital experience for patients.

---

## 🔮 Future Improvements

Potential future improvements include:

* Integration with additional hospitals
* Expansion of the chatbot knowledge base
* Doctor appointment management
* Online consultation features
* Improved patient medical-record management
* Hospital department and service search
* Multilingual chatbot support
* Voice-based medical assistance
* AI-assisted medical information retrieval
* Improved role-based access control
* Enhanced security and privacy mechanisms
* Mobile application support

---

## 📌 Project Status

**Current Status:** Active Development

The current version includes the core Medisynix web application and an AI chatbot powered by **Chatbase**, with the chatbot focused on **AKUH and Al Shifa Hospital** information.

---

## 👨‍💻 Author

**Atti Ullah**

Software Engineering / Computer Science

Final Year Project — Medisynix

---

## 📄 License

This project was developed for academic and educational purposes as a Final Year Project.
