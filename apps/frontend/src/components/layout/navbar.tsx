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
import UserMenuDropdown from "./user-menu-dropdown";
import { MobileUserMenu } from "./mobile/user-menu";
import { createNextImageUrl } from "@/lib/utils";

interface MenuItemLink {
  title: string;
  url: string;
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
    url: "https://kanaliiga.fi/",
    src: createNextImageUrl("/images/kanaliiga-logo-1800px.png"),
    alt: "Kanaliiga logo"
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
      title: "Organizations",
      url: "/organizations"
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
    { title: "Leaderboards", url: "/leaderboards" }
  ],
  mobileExtraLinks: [
    { name: "Press", url: "#" },
    { name: "Contact", url: "#" },
    { name: "Imprint", url: "#" },
    { name: "Sitemap", url: "#" }
  ]
};

export const Navigation = (props: NavbarProps) => {
  const navigationProps =
    Object.keys(props).length === 0 ? defaultProps : props;
  const { logo, menu, mobileExtraLinks } = navigationProps;

  const navRef = useRef<HTMLDivElement>(null); // Ref for the navbar
  const logoRef = useRef<HTMLImageElement>(null); // Ref for the logo

  const [isScrolled, setIsScrolled] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    const handleResize = () => {
      if (window.innerWidth > 768) setIsSheetOpen(false);
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
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
  }, [isScrolled]); // Runs when `isScrolled` changes

  return (
    <div
      ref={navRef}
      id="navigation"
      className={`pointer-events-none sticky top-0 w-full px-4 sm:landscape:px-4 sm:px-8 lg:px-16 backdrop-blur-xs landscape:backdrop-blur-none md:landscape:backdrop-blur-xs z-50 transition-all duration-300 ${isScrolled ? "scrolled" : ""}`}
    >
      <div className="pt-6 pb-4 md:pt-10 md:pb-6 mx-auto max-w-screen-xl">
        {/* Desktop Navigation - Sticky by Default */}
        <div className="hidden w-full items-center justify-center gap-6 md:flex pointer-events-auto">
          {logo && (
            <Link href={logo.url}>
              <Image
                ref={logoRef}
                className="logo transition-all"
                src={logo.src}
                alt={logo.alt}
                width={isScrolled ? 80 : 175}
                height={isScrolled ? 80 : 175}
              />
            </Link>
          )}
          <NavigationMenu viewport={false}>
            <NavigationMenuList>{menu?.map(renderMenuItem)}</NavigationMenuList>
          </NavigationMenu>
          <div className="ml-auto">
            <UserMenuDropdown />
          </div>
        </div>

        {/* Mobile Navigation - Sticky in Portrait Mode, Non-Sticky in Landscape */}
        <div className="block md:hidden sm:landscape:relative sticky top-0 z-50">
          <div className="flex items-center justify-between xs:landscape:justify-end md:landscape:justify-between">
            {logo && (
              <Link
                href={logo.url}
                className="flex items-center gap-2 landscape:hidden"
              >
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
                      renderMobileMenuItem(item, () => setIsSheetOpen(false))
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
                  <MobileUserMenu />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </div>
  );
};

const renderMenuItem = (item: MenuItem) => {
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

const renderMobileMenuItem = (item: MenuItem, closeMenuOnClick: () => void) => {
  if (item.items) {
    return (
      <AccordionItem key={item.title} value={item.title} className="border-b-0">
        <AccordionTrigger className="py-0 font-semibold text-[16px] hover:no-underline">
          {item.title}
        </AccordionTrigger>
        <AccordionContent className="mt-2">
          {item.items.map((subItem) => (
            <div className="py-2" key={subItem.title}>
              <Link href={subItem.url} onClick={closeMenuOnClick}>
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
      href={item.url}
      onClick={closeMenuOnClick}
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
