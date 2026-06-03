"use client";

import { ChevronRight, Menu } from "lucide-react";
import Image from "next/image";
import { Logo } from "@/components/kanaliiga";
import {
  useEffect,
  useRef,
  useState,
  type JSX,
  type ReactNode,
  useMemo
} from "react";
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
  NavigationMenuSub,
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
import { cn, createNextUrl } from "@/lib/utils";
import { ReadonlyURLSearchParams, useSearchParams } from "next/navigation";
import { useIsMobile } from "@/hooks/use-mobile";
import { useActiveSignupOrActiveSeasonForApp } from "@/hooks/data/useActiveSignupOrActiveSeasonForApp";
import { Separator } from "../ui/separator";
import { MobileLogOut } from "../profile/MobileLogOut";
import { useAuth } from "@/context/AuthContext";
import {
  getDefaultMenuItems,
  type MenuItem,
  type MenuItemLink,
  type RegisterCta
} from "./navigation-menu-items";

const desktopLogoWidth = 120;
const desktopLogoHeight = 138;

const desktopNavTriggerClassName =
  "h-9 min-w-[6.5rem] px-4 text-sm font-headings lg:h-10 lg:min-w-[7.5rem] lg:px-5 lg:text-base [&_svg]:size-3.5 lg:[&_svg]:size-4";

const desktopSubmenuRowClassName =
  "flex min-h-10 w-full flex-row items-center justify-start gap-2 rounded-sm px-3 text-sm";

const desktopSubmenuInteractiveClassName =
  "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground";

const desktopSubmenuContentClassName =
  "group-data-[viewport=false]/navigation-menu:!overflow-visible !w-auto min-w-[12rem] items-start p-2 text-left";

const desktopSubmenuListClassName =
  "flex w-full min-w-[12rem] list-none flex-col items-stretch justify-start gap-1";

const desktopSubmenuTriggerClassName = cn(
  desktopSubmenuRowClassName,
  desktopSubmenuInteractiveClassName,
  "!inline-flex !h-10 !max-w-none !justify-between !bg-transparent !font-normal !text-kanaliiga-orange !shadow-none focus-visible:!ring-0 data-[state=open]:!bg-accent/50"
);

const desktopSubmenuLinkClassName = cn(
  desktopSubmenuRowClassName,
  desktopSubmenuInteractiveClassName
);

interface NavbarProps {
  logo?: {
    url: string;
    src: string;
    alt: string;
  };
  menu?: MenuItem[];
  registerCta?: RegisterCta | null;
  mobileExtraLinks?: {
    name: string;
    url: string;
  }[];
  options?: {
    removeBottomPadding?: boolean;
  };
}

export const Navigation = (props: NavbarProps) => {
  const { user, logout } = useAuth();
  const { signupOrActiveSeason } = useActiveSignupOrActiveSeasonForApp(730);
  const { options, ...otherProps } = props;

  const navigationProps = useMemo(() => {
    if (Object.keys(otherProps).length === 0) {
      const { menu, registerCta } = getDefaultMenuItems(signupOrActiveSeason);

      return {
        logo: {
          url: "/",
          src: createNextUrl("/images/kanaliiga/kanaliiga-logo-1800px.png"),
          alt: "Kanaliiga logo"
        },
        menu,
        registerCta,
        mobileExtraLinks: [
          { name: "kanaliiga.fi", url: "https://kanaliiga.fi" }
        ]
      };
    }

    return props;
  }, [signupOrActiveSeason, otherProps, props]);

  const { logo, menu, mobileExtraLinks, registerCta } = navigationProps;

  const navRef = useRef<HTMLDivElement>(null);

  const { isMobile } = useIsMobile();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const params = useSearchParams();

  const sheetOpen = isMobile ? isSheetOpen : false;
  const handleSheetOpenChange = (open: boolean) => {
    if (isMobile) {
      setIsSheetOpen(open);
    }
  };

  useEffect(() => {
    const updateNavHeight = () => {
      if (navRef.current) {
        document.documentElement.style.setProperty(
          "--nav-height",
          `${navRef.current.offsetHeight}px`
        );
      }
    };

    updateNavHeight();
    window.addEventListener("resize", updateNavHeight);

    return () => window.removeEventListener("resize", updateNavHeight);
  }, []);

  return (
    <div
      ref={navRef}
      id="navigation"
      className={cn(
        `pointer-events-none w-full mx-auto sm:landscape:px-4 md:landscape:px-8 px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 z-50`,
        // Always use backdrop blur for consistent appearance
        "backdrop-blur-xs landscape:backdrop-blur-none md:landscape:backdrop-blur-xs",
        // Always use sticky positioning to prevent jumping
        "sticky top-0",
        options?.removeBottomPadding ? "mb-3" : "mb-3 sm:mb-10",
        "max-w-[1920px]"
      )}
    >
      <div
        className={cn(
          "mx-auto max-w-[1920px]",
          options?.removeBottomPadding ? "pt-4 lg:pt-8" : "py-4 lg:py-8"
        )}
      >
        {/* Desktop Navigation - Sticky by Default */}
        <div className="hidden w-full items-center justify-start lg:flex lg:pl-6 pointer-events-auto">
          {logo && (
            <Link href={logo.url}>
              <Image
                className="h-[138px] w-[120px]"
                src={logo.src}
                alt={logo.alt}
                width={desktopLogoWidth}
                height={desktopLogoHeight}
                priority
              />
            </Link>
          )}
          <NavigationMenu
            key={menu?.length || 0}
            delayDuration={0}
            viewport={false}
            className="max-w-none flex-1 justify-start lg:ml-16"
          >
            <NavigationMenuList className="justify-start gap-3 lg:gap-8">
              {menu?.map((m) => renderMenuItem(m, params))}
            </NavigationMenuList>
          </NavigationMenu>
          <div className="ml-auto flex items-center gap-4">
            {registerCta && (
              <Button
                asChild
                size="lg"
                className="h-9 bg-kanaliiga-orange px-4 text-sm text-white hover:bg-kanaliiga-orange/90 lg:h-10 lg:px-5 lg:text-base"
              >
                <Link href={createNextUrl(registerCta.url)}>
                  {registerCta.title}
                </Link>
              </Button>
            )}
            <UserMenuDropdown />
          </div>
        </div>

        {/* Mobile Navigation - Sticky in Portrait Mode, Non-Sticky in Landscape */}
        <div className="block lg:hidden sm:landscape:relative sticky top-0 z-50">
          <div className="flex items-center justify-between">
            {logo && (
              <Link href={logo.url} className="flex items-center gap-2">
                <Logo variant="mark" size="sm" />
              </Link>
            )}
            <Sheet open={sheetOpen} onOpenChange={handleSheetOpenChange}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="pointer-events-auto"
                  onClick={() => setIsSheetOpen(true)}
                >
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent className="flex flex-col overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>
                    {logo && (
                      <span className="inline-block">
                        <Link
                          href={logo.url}
                          onClick={() => setIsSheetOpen(false)}
                        >
                          <Logo variant="mark" size="sm" />
                        </Link>
                      </span>
                    )}
                  </SheetTitle>
                </SheetHeader>
                <div
                  id="mobile-menu"
                  className="my-6 mx-2 flex flex-col flex-1"
                >
                  {registerCta && (
                    <Button
                      asChild
                      className="mb-4 bg-kanaliiga-orange text-white hover:bg-kanaliiga-orange/90"
                    >
                      <Link
                        href={createNextUrl(registerCta.url)}
                        onClick={() => setIsSheetOpen(false)}
                      >
                        {registerCta.title}
                      </Link>
                    </Button>
                  )}
                  <div className="pb-4">
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
                    </Accordion>
                  </div>
                  <MobileUserMenu setIsSheetOpen={setIsSheetOpen} />
                  {mobileExtraLinks && (
                    <div>
                      <Separator className="bg-kanaliiga-orange" />
                      <div className="grid grid-cols-2 gap-4 justify-start my-4">
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
                  <div className="flex flex-wrap items-center gap-4 justify-between m-4 mt-auto">
                    {user && <MobileLogOut logOutUser={() => logout()} />}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </div>
  );
};

const renderMenuContent = (
  items: MenuItemLink[],
  params: ReadonlyURLSearchParams,
  keyPrefix: string
) => {
  const firstValue = items[0]
    ? items[0].url || `${keyPrefix}-0`
    : `${keyPrefix}-0`;
  return (
    <NavigationMenuSub
      orientation="vertical"
      defaultValue={firstValue}
      className="w-full items-start"
    >
      <NavigationMenuList className={desktopSubmenuListClassName}>
        {items.map((component, index) => {
          const value = component.url || `${keyPrefix}-${index}`;
          if (component.items) {
            return (
              <NavigationMenuItem
                key={value}
                value={value}
                className="relative z-[100] w-full"
              >
                <NavigationMenuTrigger
                  hideChevron
                  className={desktopSubmenuTriggerClassName}
                >
                  {component.title}
                  <ChevronRight
                    className="size-3 shrink-0 opacity-70"
                    aria-hidden
                  />
                </NavigationMenuTrigger>
                <NavigationMenuContent className="!left-full !top-0 z-[100] min-w-[12rem] w-auto items-start text-left shadow-lg">
                  <ul className="flex w-full min-w-[12rem] flex-col items-stretch justify-start gap-1 p-1">
                    {component.items.map((sub, subIndex) => (
                      <ListItem
                        key={`${keyPrefix}-${sub.url}-${subIndex}`}
                        title={sub.title}
                        href={sub.url}
                        {...(sub.hasFilters ? { params } : {})}
                        icon={sub.icon}
                        isExternal={sub.isExternal}
                      />
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            );
          }
          return (
            <NavigationMenuItem key={value} value={value} className="w-full">
              <NavigationMenuLink
                asChild
                className={desktopSubmenuLinkClassName}
              >
                <Link
                  href={{
                    pathname: component.url,
                    query: component.hasFilters ? params.toString() : undefined
                  }}
                  target={component.isExternal ? "_blank" : undefined}
                  rel={component.isExternal ? "noopener noreferrer" : undefined}
                >
                  {component.title} {component.icon}
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          );
        })}
      </NavigationMenuList>
    </NavigationMenuSub>
  );
};

const renderMenuItem = (item: MenuItem, params: ReadonlyURLSearchParams) => {
  if (item.items) {
    return (
      <NavigationMenuItem key={item.title}>
        <NavigationMenuTrigger
          onPointerMove={(event) => event.preventDefault()}
          className={cn(desktopNavTriggerClassName, "text-kanaliiga-orange")}
        >
          {item.title}
        </NavigationMenuTrigger>
        <NavigationMenuContent className={desktopSubmenuContentClassName}>
          {renderMenuContent(item.items, params, item.title)}
        </NavigationMenuContent>
      </NavigationMenuItem>
    );
  }

  return (
    <NavigationMenuItem key={item.title}>
      <NavigationMenuLink
        asChild
        className={cn(navigationMenuTriggerStyle(), desktopNavTriggerClassName)}
      >
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

const renderMobileMenuItems = (
  items: MenuItemLink[],
  closeMenuOnClick: () => void,
  params: ReadonlyURLSearchParams,
  accordionValuePrefix: string
): ReactNode =>
  items.map((subItem, index) => {
    const value = `${accordionValuePrefix}-${subItem.url}-${index}`;
    if (subItem.items) {
      return (
        <Accordion
          key={value}
          type="single"
          collapsible
          className="flex w-full flex-col gap-4 border-b-0"
        >
          <AccordionItem value={value} className="border-b-0">
            <AccordionTrigger className="py-2 text-sm hover:no-underline">
              {subItem.title}
            </AccordionTrigger>
            <AccordionContent className="mt-2 pl-4">
              {renderMobileMenuItems(
                subItem.items,
                closeMenuOnClick,
                params,
                value
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      );
    }
    return (
      <div className="py-2" key={value}>
        <Link
          href={{
            pathname: subItem.url,
            query: subItem.hasFilters ? params.toString() : undefined
          }}
          onClick={closeMenuOnClick}
          className="flex flex-row items-center gap-2"
          target={subItem.isExternal ? "_blank" : undefined}
          rel={subItem.isExternal ? "noopener noreferrer" : undefined}
        >
          {subItem.title} {subItem.icon}
        </Link>
      </div>
    );
  });

const renderMobileMenuItem = (
  item: MenuItem,
  closeMenuOnClick: () => void,
  params: ReadonlyURLSearchParams
) => {
  if (item.items) {
    return (
      <AccordionItem key={item.title} value={item.title} className="border-b-0">
        <AccordionTrigger className="py-0 text-sm hover:no-underline">
          {item.title}
        </AccordionTrigger>
        <AccordionContent className="mt-2">
          {renderMobileMenuItems(
            item.items,
            closeMenuOnClick,
            params,
            item.title
          )}
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
      target={item.isExternal ? "_blank" : undefined}
      rel={item.isExternal ? "noopener noreferrer" : undefined}
    >
      {item.title} {item.icon}
    </Link>
  );
};

const ListItem = ({
  title,
  href,
  params,
  icon,
  isExternal
}: React.ComponentPropsWithoutRef<"li"> & {
  href: string;
  params?: ReadonlyURLSearchParams;
  icon?: JSX.Element;
  isExternal?: boolean;
}) => {
  return (
    <li className="w-full">
      <NavigationMenuLink asChild className={desktopSubmenuLinkClassName}>
        <Link
          href={{
            pathname: href,
            query: params ? params.toString() : undefined
          }}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
        >
          {title} {icon}
        </Link>
      </NavigationMenuLink>
    </li>
  );
};
