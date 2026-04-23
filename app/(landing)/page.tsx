import Banner from "./components/Banner";
import Hero from "./components/Hero";
import PackageSection from "./components/PackageSection";
import SubscribeSteps from "./components/SubscribeSteps";

export default function Home() {
  return (
    <>
      <main>
        <Banner />
        <Hero />
        <SubscribeSteps />
        <PackageSection />
      </main>
    </>
  );
}
