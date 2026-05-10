import Banner from "./components/Banner";
import Hero from "./components/Hero";
import PackageSection from "./components/PackageSection";
import RecoveryRedirect from "./RecoveryRedirect";
import SubscribeSteps from "./components/SubscribeSteps";
import { getLandingPackages, getLandingAreas, getLandingIklans } from "@/lib/data/landing";

// ISR: revalidate tiap 1 jam — data paket & area bisa berubah tanpa deploy ulang
export const revalidate = 3600

export default async function Home() {
  const [paket, areas, iklans] = await Promise.all([
    getLandingPackages(),
    getLandingAreas(),
    getLandingIklans(),
  ])

  return (
    <>
      <RecoveryRedirect />
      <main>
        <Banner iklans={iklans} />
        <Hero areas={areas} />
        <SubscribeSteps />
        <PackageSection paket={paket} />
      </main>
    </>
  );
}
