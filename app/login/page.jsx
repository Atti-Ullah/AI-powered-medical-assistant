import AuthShell from "../../components/AuthShell";
import LoginForm from "../../components/LoginForm";

export const metadata = {
  title: "Login - Medisynix",
  description: "Login to your Medisynix account",
};

export default function LoginPage() {
  return (
    <AuthShell
      title="Your health, guided by clinical-grade intelligence."
      description="Sign in to chat with the Medisynix assistant, manage appointments and keep track of your health in one secure workspace."
    >
      <LoginForm />
    </AuthShell>
  );
}
