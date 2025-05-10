import React from "react";

const levelToCommas = (level: number) => {
  return level.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
};

const getBadgeColors = (rankScore: number) => {
  if (rankScore <= 4999) {
    // OK
    return {
      bgColor: "#2c2f37",
      borderColor: "#b1c4d999",
      textColor: "#eef2f7"
    };
  }
  if (rankScore <= 9999) {
    // OK
    return {
      bgColor: "#061c36",
      borderColor: "#5e98d999",
      textColor: "#8bc1ff"
    };
  }
  if (rankScore <= 14999) {
    // OK
    return {
      bgColor: "#060e37",
      borderColor: "#4c6aff99",
      textColor: "#8a9dfe"
    };
  }
  if (rankScore <= 19999) {
    // OK
    return {
      bgColor: "#180638",
      borderColor: "#8847ff99",
      textColor: "#b48bff"
    };
  }
  if (rankScore <= 24999) {
    // OK
    return {
      bgColor: "#320638",
      borderColor: "#d32ce699",
      textColor: "#f177ff"
    };
  }
  if (rankScore <= 29999) {
    // OK
    return {
      bgColor: "#380606",
      borderColor: "#eb4b4b99",
      textColor: "#ff8686"
    };
  }
  // Ok
  return {
    bgColor: "#383006",
    borderColor: "#ffd70099",
    textColor: "#ffdf35"
  };
};
export const CS2PremierRankBadge = ({ rankScore }: { rankScore: number }) => {
  const [largeLabel, smallLabel] = levelToCommas(rankScore).split(",");
  const { bgColor, borderColor, textColor } = getBadgeColors(Number(rankScore));

  return (
    <div className="flex cs-premier-rank">
      <svg
        viewBox="0 0 17 32"
        className="w-[1rem] h-[23px] z-[1] overflow-hidden align-middle"
        style={{ fill: textColor }}
      >
        <path d="M5.44 2.13A2.6 2.6 0 0 1 7.99 0h1.86a.6.6 0 0 1 .6.7L4.83 31.5a.6.6 0 0 1-.6.5h-2.3c-1 0-1.76-.9-1.58-1.89l5.1-27.98ZM11.82.99c.1-.57.6-.99 1.18-.99h2.93a.6.6 0 0 1 .59.7l-5.4 30.31c-.1.57-.6.99-1.18.99H7a.6.6 0 0 1-.59-.7L11.82.98Z" />
      </svg>
      <div
        className="ml-[-.25rem] min-w-12 pr-1 border-1 flex align-center justify-center pl-1 text-center whitespace-nowrap [transform:skew(-10deg)]"
        style={{
          backgroundColor: bgColor,
          borderColor: borderColor,
          color: textColor
        }}
      >
        <div className="font-bold">
          {(largeLabel || rankScore === -1) && (
            <span className="text-[0.8rem] inline-block">
              {smallLabel ? `${largeLabel},` : rankScore !== -1 ? "" : "---"}
            </span>
          )}
          {largeLabel && rankScore !== -1 && (
            <span className="text-[0.55rem] inline-block">
              {smallLabel ? smallLabel : largeLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
