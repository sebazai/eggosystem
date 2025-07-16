"use client";

import { Menu } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState, type JSX } from "react";
import Link from "next/link";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";
import UserMenuDropdown from "./UserMenuDropdown";
import { MobileUserMenu } from "./mobile/MobileUserMenu";
import { cn, convertSeasonToS, createNextUrl } from "@/lib/utils";
import {
  ReadonlyURLSearchParams,
  usePathname,
  useSearchParams
} from "next/navigation";
import { useIsMobile } from "@/hooks/use-mobile";
import { useScrolled } from "@/hooks/useScrolled";
import { useSignupOpenForAppId } from "@/hooks/data/useSignupOpenSeason";

interface MenuItemLink {
  title: string;
  url: string;
  hasFilters: boolean;
  icon?: JSX.Element;
  items?: MenuItemLink[];
}

type MenuItem = MenuItemLink;

interface NavbarProps {
  logo?: {
    url: string;
    src: string;
    alt: string;
  };
  menu?: MenuItem[];
  mobileExtraLinks?: {
    name: string;
    url: string;
  }[];
}

const defaultProps: NavbarProps = {
  logo: {
    url: "/",
    src: createNextUrl("/images/kanaliiga/kanaliiga-logo-1800px.png"),
    alt: "Kanaliiga logo"
  },
  menu: [
    {
      title: "Organizations",
      url: "/organizations",
      hasFilters: false
    },
    {
      title: "Teams",
      url: "/teams",
      hasFilters: true,
      items: [
        { title: "Browse Teams", url: "/teams", hasFilters: true },
        { title: "Top Teams", url: "/topteams", hasFilters: true }
      ]
    },
    {
      title: "Players",
      url: "/players",
      hasFilters: true
    },
    {
      title: "Matches",
      url: "/matches",
      hasFilters: true
    },
    {
      title: "Leaderboards",
      url: "/leaderboards",
      hasFilters: true
    },
    {
      title: "Kanahautomo",
      url: "/kanahautomo",
      hasFilters: false
    }
  ]
  // mobileExtraLinks: [
  //   { name: "Press", url: "#" },
  //   { name: "Contact", url: "#" },
  //   { name: "Imprint", url: "#" },
  //   { name: "Sitemap", url: "#" }
  // ]
};

export const Navigation = (props: NavbarProps) => {
  const pathname = usePathname();
  const { seasonWithSignupOpen } = useSignupOpenForAppId(730);
  const navigationProps =
    Object.keys(props).length === 0 ? defaultProps : props;
  const { logo, menu, mobileExtraLinks } = navigationProps;

  const navRef = useRef<HTMLDivElement>(null); // Ref for the navbar
  const logoRef = useRef<HTMLImageElement>(null); // Ref for the logo

  const { isScrolled, scrolledTo } = useScrolled();

  const { isMobile } = useIsMobile();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const params = useSearchParams();

  useEffect(() => {
    if (!isMobile) {
      setIsSheetOpen(false);
    }
  }, [isMobile]);

  useEffect(() => {
    if (isScrolled && !hasScrolled) {
      setHasScrolled(true);
    }
  }, [isScrolled, hasScrolled]);

  const [height, setHeight] = useState(0);

  useEffect(() => {
    const updateHeight = () => setHeight(window.innerHeight);
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  useEffect(() => {
    const logoEl = logoRef.current;
    if (!logoEl) return;

    const updateNavHeightAndCheckMobile = () => {
      if (navRef.current) {
        const newHeight = navRef.current.offsetHeight;
        document.documentElement.style.setProperty(
          "--nav-height",
          `${newHeight}px`
        );
      }
    };

    updateNavHeightAndCheckMobile();

    logoEl.addEventListener("transitionend", updateNavHeightAndCheckMobile);
    logoEl.addEventListener("resize", updateNavHeightAndCheckMobile);

    return () => {
      logoEl.removeEventListener(
        "transitionend",
        updateNavHeightAndCheckMobile
      );
      logoEl.removeEventListener("resize", updateNavHeightAndCheckMobile);
    };
  }, []);

  return (
    <div
      ref={navRef}
      id="navigation"
      className={cn(
        `mb-3 sm:mb-10 pointer-events-none w-full px-4 sm:landscape:px-2 md:landscape:px-6 sm:px-8 lg:px-16 z-50 ${isScrolled ? "scrolled" : ""}`,
        pathname !== "/"
          ? "backdrop-blur-xs landscape:backdrop-blur-none md:landscape:backdrop-blur-xs"
          : scrolledTo > height
            ? "backdrop-blur-xs landscape:backdrop-blur-none md:landscape:backdrop-blur-xs"
            : "",
        isScrolled || pathname !== "/" ? "sticky top-0" : "absolute top-0"
      )}
    >
      <div className="py-4 lg:py-8 mx-auto max-w-screen-2xl">
        {/* Desktop Navigation - Sticky by Default */}
        <div className="hidden w-full items-center justify-center gap-6 lg:flex pointer-events-auto">
          {logo && (
            <Link href={logo.url}>
              <Image
                ref={logoRef}
                className={cn(
                  "logo transition-all duration-500",
                  hasScrolled || pathname === "/" ? "logo-small" : "logo-large"
                )}
                src={logo.src}
                alt={logo.alt}
                width={153}
                height={175}
                priority
              />
            </Link>
          )}
          <NavigationMenu delayDuration={0} viewport={false}>
            <NavigationMenuList>
              {menu?.map((m) => renderMenuItem(m, params))}
              {seasonWithSignupOpen &&
                renderMenuItem(
                  {
                    title: `Register ${convertSeasonToS(
                      seasonWithSignupOpen.full_name
                    )}`,
                    url: `/seasons/${seasonWithSignupOpen.season_id}/signup`,
                    hasFilters: false
                  },
                  params
                )}
            </NavigationMenuList>
          </NavigationMenu>
          <div className="ml-auto space-x-4">
            <UserMenuDropdown />
          </div>
        </div>

        {/* Mobile Navigation - Sticky in Portrait Mode, Non-Sticky in Landscape */}
        <div className="block lg:hidden sm:landscape:relative sticky top-0 z-50">
          <div className="flex items-center justify-between xs:landscape:justify-end md:landscape:justify-between">
            {logo && (
              <Link href={logo.url} className="flex items-center gap-2">
                <Image src={logo.src} alt={logo.alt} width={75} height={75} />
              </Link>
            )}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="pointer-events-auto"
                  onClick={() => setIsSheetOpen(true)}
                >
                  <Menu className="size-6" />
                </Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>
                    {logo && (
                      <span className="inline-block">
                        <Link
                          href={logo.url}
                          onClick={() => setIsSheetOpen(false)}
                        >
                          <Image
                            src={logo.src}
                            alt={logo.alt}
                            width={75}
                            height={75}
                          />
                        </Link>
                      </span>
                    )}
                  </SheetTitle>
                </SheetHeader>
                <div id="mobile-menu" className="my-6 mx-2 flex flex-col gap-6">
                  <Accordion
                    type="single"
                    collapsible
                    className="flex w-full flex-col gap-4"
                  >
                    {menu?.map((item) =>
                      renderMobileMenuItem(
                        item,
                        () => setIsSheetOpen(false),
                        params
                      )
                    )}
                    {seasonWithSignupOpen && (
                      <Link
                        href={`/seasons/${seasonWithSignupOpen.season_id}/signup`}
                        onClick={() => setIsSheetOpen(false)}
                        className="font-semibold font-headings text-kanaliiga-orange"
                      >
                        Register{" "}
                        {convertSeasonToS(seasonWithSignupOpen.full_name)}
                      </Link>
                    )}
                  </Accordion>
                  {mobileExtraLinks && (
                    <div className="border-t py-4">
                      <div className="grid grid-cols-2 gap-4 justify-start">
                        {mobileExtraLinks.map((link, idx) => (
                          <Link
                            key={idx}
                            href={link.url}
                            onClick={() => setIsSheetOpen(false)}
                          >
                            {link.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                  <MobileUserMenu setIsSheetOpen={setIsSheetOpen} />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </div>
  );
};

const renderMenuItem = (item: MenuItem, params: ReadonlyURLSearchParams) => {
  if (item.items) {
    return (
      <NavigationMenuItem key={item.title}>
        <NavigationMenuTrigger
          onPointerMove={(event) => event.preventDefault()}
          className="text-kanaliiga-orange"
        >
          {item.title}
        </NavigationMenuTrigger>
        <NavigationMenuContent>
          <ul className="grid w-[200px] gap-4">
            {item.items.map((component) => (
              <ListItem
                key={component.title}
                title={component.title}
                href={component.url}
                {...(component.hasFilters ? { params } : {})}
              />
            ))}
          </ul>
        </NavigationMenuContent>
      </NavigationMenuItem>
    );
  }

  return (
    <NavigationMenuItem key={item.title}>
      <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
        <Link
          href={{
            pathname: item.url,
            query: item.hasFilters ? params.toString() : undefined
          }}
        >
          {item.title}
        </Link>
      </NavigationMenuLink>
    </NavigationMenuItem>
  );
};

const renderMobileMenuItem = (
  item: MenuItem,
  closeMenuOnClick: () => void,
  params: ReadonlyURLSearchParams
) => {
  if (item.items) {
    return (
      <AccordionItem key={item.title} value={item.title} className="border-b-0">
        <AccordionTrigger className="py-0 font-semibold text-[14px] hover:no-underline">
          {item.title}
        </AccordionTrigger>
        <AccordionContent className="mt-2">
          {item.items.map((subItem) => (
            <div className="py-2" key={subItem.title}>
              <Link
                href={{
                  pathname: subItem.url,
                  query: subItem.hasFilters ? params.toString() : undefined
                }}
                onClick={closeMenuOnClick}
              >
                {subItem.title}
              </Link>
            </div>
          ))}
        </AccordionContent>
      </AccordionItem>
    );
  }
  return (
    <Link
      key={item.title}
      href={{
        pathname: item.url,
        query: item.hasFilters ? params.toString() : undefined
      }}
      onClick={closeMenuOnClick}
      className="font-semibold font-headings"
    >
      {item.title}
    </Link>
  );
};

const ListItem = ({
  title,
  href,
  params
}: React.ComponentPropsWithoutRef<"li"> & {
  href: string;
  params?: ReadonlyURLSearchParams;
}) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          href={{
            pathname: href,
            query: params ? params.toString() : undefined
          }}
          className="flex flex-row items-center gap-2"
        >
          {title}
        </Link>
      </NavigationMenuLink>
    </li>
  );
};
