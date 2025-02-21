import FlipCard from "@/components/company-card";

export default function Home() {
  return (
    <div>
      <h1>Yritykset</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-6">
        <FlipCard
          frontTitle="Kanaliiga"
          frontDesc="On paras Kana"
          backTitle="Jepulis"
          backDesc="Nebulis"
          href="http://kanaliiga.fi"
          imageSrc={`${process.env.NEXT_PUBLIC_BASE_URL}images/kanaliiga-logo-64px.png`}
        />
        <FlipCard
          frontTitle="Kanaliiga"
          frontDesc="On paras Kana"
          backTitle="Jepulis"
          backDesc="Nebulis"
          href="http://kanaliiga.fi"
          imageSrc={`${process.env.NEXT_PUBLIC_BASE_URL}images/kanaliiga-logo-64px.png`}
        />
        <FlipCard
          frontTitle="Kanaliiga"
          frontDesc="On paras Kana"
          backTitle="Jepulis"
          backDesc="Nebulis"
          href="http://kanaliiga.fi"
          imageSrc={`${process.env.NEXT_PUBLIC_BASE_URL}images/kanaliiga-logo-64px.png`}
        />
        <FlipCard
          frontTitle="Kanaliiga"
          frontDesc="On paras Kana"
          backTitle="Jepulis"
          backDesc="Nebulis"
          href="http://kanaliiga.fi"
          imageSrc={`${process.env.NEXT_PUBLIC_BASE_URL}images/kanaliiga-logo-64px.png`}
        />
        <FlipCard
          frontTitle="Kanaliiga"
          frontDesc="On paras Kana"
          backTitle="Jepulis"
          backDesc="Nebulis"
          href="http://kanaliiga.fi"
          imageSrc={`${process.env.NEXT_PUBLIC_BASE_URL}images/kanaliiga-logo-64px.png`}
        />
      </div>
    </div>
  );
}
