const steps = [
    {
      title: "Choice Package",
      body: "Choose the internet package that suits your needs.",
    },
    {
      title: "Fill in the Forms",
      body: "Complete your personal detail and installation information.",
    },
    {
      title: "Admin Approval",
      body: "Our team is processing and verifying your registration.",
    },
    {
      title: "Portal Akses",
      body: "Log in and manage your service independently.",
    },
  ];
  
  export default function SubscribeSteps() {
    return (
      <section className="bg-white px-5 py-8 sm:px-8 md:py-14">
        <div className="mx-auto max-w-6xl rounded-lg bg-[#ffd66f] px-6 py-10 text-center sm:px-10">
          <h2 className="text-3xl font-black text-black sm:text-4xl">How to Subscribe</h2>
          <p className="mt-1 text-sm text-black sm:text-base">A simple, fast, and fully digital process.</p>
  
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <article key={step.title}>
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#68247B] text-xl font-black text-white">
                  {index + 1}
                </div>
                <h3 className="mt-4 text-xl font-black text-black">{step.title}</h3>
                <p className="mx-auto mt-2 max-w-44 text-sm font-semibold leading-snug text-black">{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }
  
