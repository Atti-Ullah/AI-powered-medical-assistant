import HeroSection from "../components/landing/HeroSection";
import TrustBar from "../components/landing/TrustBar";
import FeaturesSection from "../components/landing/FeaturesSection";
import HowItWorks from "../components/landing/HowItWorks";
import ChatbotDemo from "../components/landing/ChatbotDemo";
import TestimonialsSection from "../components/landing/TestimonialsSection";
import Disclaimer from "../components/landing/Disclaimer";
import ContactSection from "../components/landing/ContactSection";

export default function HomePage() {
  return (
    <div>
      <HeroSection />
      <TrustBar />
      <FeaturesSection />
      <HowItWorks />
      <ChatbotDemo />
      <TestimonialsSection />
      <Disclaimer />
      <ContactSection />
    </div>
  );
}