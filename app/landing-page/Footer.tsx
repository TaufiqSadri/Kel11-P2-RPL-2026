import { Instagram, MapPin, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const services = ["Internet Packages", "Promo", "Coverage Area", "FAQ", "Dashboard"];
const aboutLinks = ["About", "Contact", "Gallery", "Terms & Condition", "Privacy Policy"];

export default function Footer() {
  return (
    <footer className="bg-[#68247B] px-6 py-10 text-white sm:px-10 lg:py-12">
      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1.5fr_1.2fr_1fr_1fr] lg:gap-16">
        <section>
          <Link href="/" aria-label="District Net home" className="inline-flex">
            <Image
              src="/district_net.svg"
              alt="District Net"
              width={290}
              height={92}
              className="h-20 w-auto"
            />
          </Link>
          <p className="mt-4 max-w-sm text-sm font-semibold leading-relaxed text-white/85">
            The best internet provider with ultra-fast connection, now comes with various internet packages to suit your needs.
          </p>
        </section>

        <section>
          <h2 className="text-3xl font-black tracking-wide">Adress</h2>
          <ul className="mt-6 space-y-4 text-base font-black leading-relaxed text-white/90">
            <li className="flex gap-3">
              <MapPin className="mt-1 h-5 w-5 shrink-0 fill-[#d8684a] text-[#d8684a]" />
              <span>Jl Raya Padang-Bukittinggi, Padang Pariaman Regency, West Sumatera</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="h-5 w-5 shrink-0 fill-[#7b61ff] text-[#7b61ff]" />
              <span>+62 812 5600 2100</span>
            </li>
            <li className="flex items-center gap-3">
              <Instagram className="h-5 w-5 shrink-0 text-[#ff8b8b]" />
              <span>@distric_net</span>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-3xl font-black tracking-wide">Service</h2>
          <ul className="mt-6 space-y-3 text-base font-black text-white/90">
            {services.map((item) => (
              <li key={item}>
                <Link href="#" className="transition hover:text-brand-yellow">
                  &gt; {item}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-3xl font-black tracking-wide">About</h2>
          <ul className="mt-6 space-y-3 text-base font-black text-white/90">
            {aboutLinks.map((item) => (
              <li key={item}>
                <Link href="#" className="transition hover:text-brand-yellow">
                  &gt; {item}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </footer>
  );
}
