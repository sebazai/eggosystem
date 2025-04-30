"use server";

import HeroSection from "@/components/layout/hero-section";
import { headers } from "next/headers";
import { userAgent } from "next/server";

export default async function Home() {
  const { device } = userAgent({ headers: await headers() });
  const deviceType = device?.type === "mobile" ? "mobile" : "desktop";
  return (
    <>
      <section className="bg-black mb-10 xs:mb-25">
        <HeroSection device={deviceType} />
      </section>
      <section className="py-4 md:py-8 lg:py-16">
        <div className="flex flex-grow justify-center w-full">
          <div className="w-full max-w-screen-2xl px-4 sm:px-8 lg:px-16">
            <h1>Kanahub by Kanaliiga</h1>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam a
              mollis elit. Orci varius natoque penatibus et magnis dis
              parturient montes, nascetur ridiculus mus. Duis mattis ipsum
              lectus, non viverra justo mattis quis. Sed massa dui, fringilla et
              lacus ut, tempor tincidunt arcu. Proin dapibus auctor convallis.
              Nullam posuere fermentum ex eget fermentum. Nam eros leo, sagittis
              ac nunc id, molestie lacinia libero. Pellentesque dignissim id
              turpis ultricies fermentum. In scelerisque pulvinar ligula, a
              lacinia elit rutrum in. Nulla nibh felis, sollicitudin congue urna
              ac, dignissim dignissim enim.
            </p>
            <h2>Kanahub</h2>
            <p>
              Curabitur commodo tempus arcu a maximus. Pellentesque erat est,
              blandit a lectus pellentesque, elementum gravida felis. Nam et
              arcu fringilla, fringilla libero ut, malesuada nibh. Praesent
              molestie commodo velit ac tristique. Duis ac gravida tortor, vitae
              efficitur sapien. Ut non sagittis velit. Curabitur maximus nibh ut
              justo dapibus, non dignissim lacus molestie. Duis volutpat erat
              mauris, sed elementum ex ultricies a. Vestibulum ligula orci,
              auctor ut lacus at, cursus finibus diam. Sed iaculis urna metus,
              quis porttitor ante rutrum et. Integer sed eros lorem. Suspendisse
              quis hendrerit mi, id tempor libero. Nunc sit amet sollicitudin
              turpis. Etiam tincidunt metus eget sapien condimentum, at
              consequat erat tincidunt. Quisque risus ex, pharetra fringilla
              eleifend quis, hendrerit nec turpis.
            </p>
            <h3>Eggosystem</h3>
            <p>
              Donec ac tellus nibh. Nulla eu imperdiet nibh, in blandit tellus.
              Donec libero turpis, luctus eget porta ut, vulputate lobortis
              velit. Mauris tempus neque quis vehicula laoreet. Donec nec ex
              dolor. Cras risus mi, sagittis sed dui ac, efficitur hendrerit
              ante. Praesent facilisis dolor a lacus porttitor ornare eget non
              mi. Donec augue felis, dictum ac elit id, volutpat auctor ipsum.
              Cras nulla arcu, fringilla vel dolor eget, pulvinar fermentum
              odio.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
