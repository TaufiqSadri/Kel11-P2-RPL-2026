const packages = [
    {
      speed: "25",
      price: "250.000",
      benefits: ["Kecepatan internet hingga 25 Mbps", "Bisa digunakan untuk 4-6 perangkat", "Kuota tidak terbatas"],
    },
    {
      speed: "35",
      price: "370.000",
      benefits: ["Kecepatan internet hingga 35 Mbps", "Bisa digunakan untuk 10-13 perangkat", "Kuota tidak terbatas"],
    },
    {
      speed: "50",
      price: "400.000",
      benefits: ["Kecepatan internet hingga 50 Mbps", "Bisa digunakan untuk banyak perangkat", "Kuota tidak terbatas"],
    },
  ];
  
  export default function PackageSection() {
    return (
      <section
        id="package"
        className="border-t border-gray-300 bg-[radial-gradient(circle_at_20%_0%,#f2dce9_0,#ffffff_28%,#e8efff_58%,#ffffff_100%)] px-5 py-14 sm:px-8 md:py-20"
      >
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-4xl font-black text-black">Package</h2>
  
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {packages.map((item) => (
              <article key={item.speed} className="overflow-hidden rounded-lg border border-gray-400 bg-white shadow-sm">
                <div className="h-48 bg-[#d9d9d9]" />
                <div className="p-4">
                  <div className="text-center">
                    <strong className="block text-6xl font-black leading-none text-[#68247B]">{item.speed}</strong>
                    <span className="text-xl font-black text-[#68247B]">Mbps</span>
                  </div>
  
                  <p className="mt-4 text-center text-sm font-black text-black">
                    Rp <span className="text-2xl">{item.price}</span>
                    <span className="text-xs text-[#68247B]">/ month</span>
                  </p>
  
                  <div className="mt-4 grid gap-2">
                    <button className="h-11 rounded bg-[#68247B] text-sm font-black text-white">Subscribe Now</button>
                    <button className="h-11 rounded border border-[#68247B] bg-white text-sm font-black text-[#68247B]">
                      Chat Sales
                    </button>
                  </div>
  
                  <div className="mt-6 border-t border-gray-100 pt-4">
                    <div className="flex items-center justify-between text-base font-black text-black">
                      <span>Benefits</span>
                      <span>-</span>
                    </div>
                    <ul className="mt-4 space-y-1 text-sm font-bold leading-snug text-black">
                      {item.benefits.map((benefit) => (
                        <li key={benefit}>- {benefit}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }
  
