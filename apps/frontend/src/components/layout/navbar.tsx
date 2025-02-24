"use client";

import { Menu } from "lucide-react";
import Image from "next/image";

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
import { useEffect, useLayoutEffect, useState, type JSX } from "react";
import Link from "next/link";

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
    src: `${process.env.NEXT_PUBLIC_BASE_URL}images/kanaliiga-logo-1800px.png`,
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
      url: "#"
    },
    {
      title: "Companies",
      url: "/organizations"
    },
    {
      url: `https://kanaliiga.fi/`,
      src: `${process.env.NEXT_PUBLIC_BASE_URL}images/kanaliiga-logo-1800px.png`,
      alt: "Kanaliiga logo"
    },
    {
      title: "Teams",
      url: "#",
      items: [
        {
          title: "Top Teams",
          url: "#"
        }
      ]
    },
    {
      title: "Players",
      url: "#"
    },
    {
      title: "Leaderboards",
      url: "#"
    }
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

  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useLayoutEffect(() => {
    const updateNavHeight = () => {
      const nav = document.getElementById("navigation");
      if (nav) {
        document.documentElement.style.setProperty(
          "--nav-height",
          `${nav.offsetHeight}px`
        );
      }
    };

    updateNavHeight(); // Run on mount
    window.addEventListener("resize", updateNavHeight); // Handle window resize
    window.addEventListener("load", updateNavHeight);
    return () => {
      window.removeEventListener("resize", updateNavHeight);
      window.removeEventListener("load", updateNavHeight);
    };
  }, []);

  useEffect(() => {
    const updateNavHeight = () => {
      const nav = document.getElementById("navigation");
      if (nav) {
        document.documentElement.style.setProperty(
          "--nav-height",
          `${nav.offsetHeight}px`
        );
      }
    };

    updateNavHeight(); // Update when `isScrolled` changes
  }, [scrollY]);

  return (
    <div className="container py-8 mx-auto">
      <div className="hidden w-full flex-col items-center justify-center gap-6 md:flex">
        <NavigationMenu viewport={false}>
          <NavigationMenuList>
            {menu?.map((item) => renderMenuItem(item, scrollY))}
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
                    <Link href={logo.url} className="flex items-center gap-2">
                      <Image
                        src={logo.src}
                        alt={logo.alt}
                        width={75}
                        height={75}
                      />
                    </Link>
                  )}
                </SheetTitle>
              </SheetHeader>
              <div className="my-6 mx-2 flex flex-col gap-6">
                <Accordion
                  type="single"
                  collapsible
                  className="flex w-full flex-col gap-4"
                >
                  {menu?.map(renderMobileMenuItem)}
                </Accordion>
                {mobileExtraLinks && (
                  <div className="border-t py-4">
                    <div className="grid grid-cols-2 justify-start">
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
  );
};

const renderMenuItem = (item: MenuItem, scrollY: number) => {
  if ("src" in item) {
    return (
      <NavigationMenuItem key={item.alt}>
        <Link
          key={item.alt}
          href={item.url}
          className="flex items-center gap-2 transition-all duration-300"
        >
          <Image
            src={item.src}
            alt={item.alt}
            width={Math.max(80, 150 - scrollY)} // Shrinks dynamically
            height={Math.max(80, 150 - scrollY)}
            className="transition-all duration-300"
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
  if ("src" in item) {
    return null;
  }
  if (item.items) {
    return (
      <AccordionItem key={item.title} value={item.title} className="border-b-0">
        <AccordionTrigger className="py-0 font-semibold hover:no-underline">
          {item.title}
        </AccordionTrigger>
        <AccordionContent className="mt-2">
          {item.items.map((subItem) => (
            <Link key={subItem.title} href={subItem.url}>
              {subItem.icon}
              <div>
                <div className="text-sm font-semibold">{subItem.title}</div>
              </div>
            </Link>
          ))}
        </AccordionContent>
      </AccordionItem>
    );
  }

  return (
    <Link key={item.title} href={item.url} className="font-semibold">
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
        <Link href={href} className="flex-row items-center gap-2">
          {title}
        </Link>
      </NavigationMenuLink>
    </li>
  );
};
