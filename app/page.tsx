import Navbar from "./components/Navbar";
import Banner from "./landing-page/Banner";
import Footer from "./landing-page/Footer";
import Hero from "./landing-page/Hero";
import PackageSection from "./landing-page/PackageSection";
import SubscribeSteps from "./landing-page/SubscribeSteps";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Banner />
        <Hero />
        <SubscribeSteps />
        <PackageSection />
        <Footer />
      </main>
    </>
  );
}
