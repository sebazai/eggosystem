"use client";

import { Menu } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState, type JSX, type RefObject } from "react";
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

interface MenuItemLink {
  title: string;
  url: string;
  icon?: JSX.Element;
  items?: MenuItemLink[];
}
interface MenuItemLogo {
  src: string;
  url: string;
  alt: string;
}

type MenuItem = MenuItemLink | MenuItemLogo;

interface NavbarProps {
  logo?: {
    url: string;
    src: string;
    alt: string;
    title: string;
  };
  menu?: MenuItem[];
  mobileExtraLinks?: {
    name: string;
    url: string;
  }[];
  auth?: {
    login: {
      text: string;
      url: string;
    };
  };
}

const defaultProps: NavbarProps = {
  logo: {
    url: `https://kanaliiga.fi/`,
    src: `/images/kanaliiga-logo-1800px.png`,
    alt: "Kanaliiga logo",
    title: "Kanaliiga"
  },
  menu: [
    {
      title: "Home",
      url: "#"
    },
    {
      title: "Matches",
      url: "/matches"
    },
    {
      title: "Companies",
      url: "/organizations"
    },
    {
      url: `https://kanaliiga.fi/`,
      src: `/images/kanaliiga-logo-1800px.png`,
      alt: "Kanaliiga logo"
    },
    {
      title: "Teams",
      url: "#",
      items: [
        { title: "Browse Teams", url: "#" },
        { title: "Top Teams", url: "#" }
      ]
    },
    { title: "Players", url: "#" },
    { title: "Leaderboards", url: "#" }
  ],
  mobileExtraLinks: [
    { name: "Press", url: "#" },
    { name: "Contact", url: "#" },
    { name: "Imprint", url: "#" },
    { name: "Sitemap", url: "#" }
  ],
  auth: {
    login: { text: "Log in", url: "#" }
  }
};

export const Navigation = (props: NavbarProps) => {
  const navigationProps =
    Object.keys(props).length === 0 ? defaultProps : props;
  const { logo, menu, mobileExtraLinks, auth } = navigationProps;

  const navRef = useRef<HTMLDivElement>(null); // Ref for the navbar
  const logoRef = useRef<HTMLImageElement>(null); // Ref for the logo

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const logoEl = logoRef.current;
    if (!logoEl) return;

    const updateNavHeight = () => {
      if (navRef.current) {
        const newHeight = navRef.current.offsetHeight;
        document.documentElement.style.setProperty(
          "--nav-height",
          `${newHeight}px`
        );
      }
    };

    updateNavHeight();

    logoEl.addEventListener("transitionend", updateNavHeight);
    logoEl.addEventListener("resize", updateNavHeight);

    return () => {
      logoEl.removeEventListener("transitionend", updateNavHeight);
      logoEl.removeEventListener("resize", updateNavHeight);
    };
  }, [isScrolled]); // Runs when `isScrolled` changes

  return (
    <div
      ref={navRef}
      id="navigation"
      className={`sticky top-0 w-full backdrop-blur-xs z-50 transition-all duration-300 ${isScrolled ? "scrolled" : ""}`}
    >
      <div className="container pt-12 pb-8 mx-auto">
        <div className="hidden w-full flex-col items-center justify-center gap-6 md:flex">
          <NavigationMenu viewport={false}>
            <NavigationMenuList>
              {menu?.map((item) => renderMenuItem(item, isScrolled, logoRef))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        <div className="block md:hidden">
          <div className="flex items-center justify-between">
            {logo && (
              <Link href={logo.url} className="flex items-center gap-2">
                <Image src={logo.src} alt={logo.alt} width={75} height={75} />
              </Link>
            )}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="size-6" />
                </Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>
                    {logo && (
                      <span className="inline-block">
                        <Link href={logo.url}>
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
                    {menu?.map(renderMobileMenuItem)}
                  </Accordion>
                  {mobileExtraLinks && (
                    <div className="border-t py-4">
                      <div className="grid grid-cols-2 gap-4 justify-start">
                        {mobileExtraLinks.map((link, idx) => (
                          <Link key={idx} href={link.url}>
                            {link.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                  {auth && (
                    <div className="flex flex-col gap-3">
                      <Button asChild variant="outline">
                        <Link href={auth.login.url}>{auth.login.text}</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </div>
  );
};

const renderMenuItem = (
  item: MenuItem,
  isScrolled: boolean,
  logoRef: RefObject<HTMLImageElement | null>
) => {
  if ("src" in item) {
    return (
      <NavigationMenuItem key={item.alt}>
        <Link
          href={item.url}
          className="flex items-center gap-2 transition-all"
        >
          <Image
            ref={logoRef}
            className="logo transition-all"
            src={item.src}
            alt={item.alt}
            width={isScrolled ? 80 : 175}
            height={isScrolled ? 80 : 175}
          />
        </Link>
      </NavigationMenuItem>
    );
  }
  if (item.items) {
    return (
      <NavigationMenuItem key={item.title}>
        <NavigationMenuTrigger>{item.title}</NavigationMenuTrigger>
        <NavigationMenuContent>
          <ul className="grid w-[200px] gap-4">
            {item.items.map((component) => (
              <ListItem
                key={component.title}
                title={component.title}
                href={component.url}
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
        <Link href={item.url}>{item.title}</Link>
      </NavigationMenuLink>
    </NavigationMenuItem>
  );
};

const renderMobileMenuItem = (item: MenuItem) => {
  if ("src" in item) return null;
  if (item.items) {
    return (
      <AccordionItem key={item.title} value={item.title} className="border-b-0">
        <AccordionTrigger className="py-0 font-semibold text-[16px] hover:no-underline">
          {item.title}
        </AccordionTrigger>
        <AccordionContent className="mt-2">
          {item.items.map((subItem) => (
            <div className="py-2" key={subItem.title}>
              <Link href={subItem.url}>{subItem.title}</Link>
            </div>
          ))}
        </AccordionContent>
      </AccordionItem>
    );
  }
  return (
    <Link
      key={item.title}
      href={item.url}
      className="font-semibold font-headings"
    >
      {item.title}
    </Link>
  );
};

const ListItem = ({
  title,
  href
}: React.ComponentPropsWithoutRef<"li"> & { href: string }) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link href={href} className="flex flex-row items-center gap-2">
          {title}
        </Link>
      </NavigationMenuLink>
    </li>
  );
};
