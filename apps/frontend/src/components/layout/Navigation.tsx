"use client";

import { ChevronRight, ExternalLink, Menu } from "lucide-react";
import Image from "next/image";
import { Logo } from "@/components/kanaliiga";
import {
  useEffect,
  useReducer,
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
import { cn, convertSeasonToS, createNextUrl } from "@/lib/utils";
import {
  ReadonlyURLSearchParams,
  usePathname,
  useSearchParams
} from "next/navigation";
import { useIsMobile } from "@/hooks/use-mobile";
import { useScrolled } from "@/hooks/useScrolled";
import { useActiveSignupOrActiveSeasonForApp } from "@/hooks/data/useActiveSignupOrActiveSeasonForApp";
import type { ActiveSignupOrSeasonForAppId } from "@eggosystem/types";
import { Separator } from "../ui/separator";
import { MobileLogOut } from "../profile/MobileLogOut";
import { useAuth } from "@/context/AuthContext";

interface MenuItemLink {
  title: string;
  url: string;
  hasFilters: boolean;
  isExternal?: boolean;
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
  options?: {
    removeBottomPadding?: boolean;
    fullWidth?: boolean;
  };
}

const getSeasonMenuItems = (
  signupOrActiveSeason?: ActiveSignupOrSeasonForAppId
) => {
  if (!signupOrActiveSeason || !signupOrActiveSeason.full_name) {
    return [];
  }

  const now = new Date();
  const signupStartDate = signupOrActiveSeason.signup_start_date
    ? new Date(signupOrActiveSeason.signup_start_date)
    : null;
  const signupEndDate = signupOrActiveSeason.signup_end_date
    ? new Date(signupOrActiveSeason.signup_end_date)
    : null;
  const startDate = new Date(signupOrActiveSeason.start_date);

  // Check if season is in signup period but hasn't started yet
  const isInSignupPeriod =
    signupStartDate &&
    signupEndDate &&
    now >= signupStartDate &&
    now <= signupEndDate &&
    now < startDate;

  // If in signup period (not started), show only Register button
  if (isInSignupPeriod) {
    return [
      {
        title: `Register ${convertSeasonToS(signupOrActiveSeason.full_name)}`,
        url: `/seasons/${signupOrActiveSeason.season_id}/signup`,
        hasFilters: false
      }
    ];
  }

  // Season has started, show full menu
  return [
    {
      title: `${convertSeasonToS(signupOrActiveSeason.full_name)}`,
      url: "#",
      hasFilters: false,
      items: [
        ...(signupOrActiveSeason.signup_end_date &&
        new Date(signupOrActiveSeason.signup_end_date) >= new Date()
          ? [
              {
                title: "Register",
                url: `/seasons/${signupOrActiveSeason.season_id}/signup`,
                hasFilters: false
              }
            ]
          : []),
        {
          title: "Standings",
          url: `/seasons/${signupOrActiveSeason.season_id}/standings`,
          hasFilters: false
        },
        {
          title: "Calendar",
          url: `/seasons/${signupOrActiveSeason.season_id}/calendar`,
          hasFilters: false
        },
        {
          title: "Playoff Bracket",
          url: `/seasons/${signupOrActiveSeason.season_id}/leagues/1/playoff`,
          hasFilters: false
        },
        {
          title: "Captains",
          url: `/seasons/${signupOrActiveSeason.season_id}/captains`,
          hasFilters: false
        },
        {
          title: "Schedule",
          url: "https://kanaliiga.fi/pelit/counter-strike-2",
          hasFilters: false,
          isExternal: true,
          icon: <ExternalLink className="h-4 w-4" />
        },
        {
          title: "Faceit Links",
          url: `/seasons/${signupOrActiveSeason.season_id}/faceit-links`,
          hasFilters: false
        },
        {
          title: "Fantasy League",
          url: `/seasons/${signupOrActiveSeason.season_id}/fantasy`,
          hasFilters: false,
          items: [
            {
              title: "Draft",
              url: `/seasons/${signupOrActiveSeason.season_id}/fantasy`,
              hasFilters: false
            },
            {
              title: "Leaderboard",
              url: `/seasons/${signupOrActiveSeason.season_id}/fantasy/leaderboard`,
              hasFilters: false
            },
            {
              title: "Price History",
              url: `/seasons/${signupOrActiveSeason.season_id}/fantasy/price-history`,
              hasFilters: false
            },
            {
              title: "Top Players",
              url: `/seasons/${signupOrActiveSeason.season_id}/fantasy/top-players`,
              hasFilters: false
            }
          ]
        }
      ]
    }
  ];
};

const getDefaultMenuItems = (
  signupOrActiveSeason?: ActiveSignupOrSeasonForAppId
) => {
  const seasonMenuItems = getSeasonMenuItems(signupOrActiveSeason);
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
        url: "#",
        hasFilters: false,
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
        url: "#",
        hasFilters: false,
        items: [
          {
            title: "Player Leaderboards",
            url: "/leaderboards",
            hasFilters: true
          },
          { title: "Hall of Fame", url: "/hall-of-fame", hasFilters: false },
          { title: "Season Results", url: "/season-results", hasFilters: false }
        ]
      },
      {
        title: "Kanahautomo",
        url: "/kanahautomo",
        hasFilters: false
      },
      ...seasonMenuItems
    ],
    mobileExtraLinks: [{ name: "kanaliiga.fi", url: "https://kanaliiga.fi" }]
  };
  return defaultProps;
};

export const Navigation = (props: NavbarProps) => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { signupOrActiveSeason } = useActiveSignupOrActiveSeasonForApp(730);
  const { options, ...otherProps } = props;

  // Memoize navigationProps to avoid recalculating on every render
  // getSeasonMenuItems returns [] when signupOrActiveSeason is undefined (during SSR/initial load)
  // This keeps the menu structure stable until data loads
  const navigationProps = useMemo(() => {
    return Object.keys(otherProps).length === 0
      ? getDefaultMenuItems(signupOrActiveSeason)
      : props;
  }, [signupOrActiveSeason, otherProps, props]);

  const { logo, menu, mobileExtraLinks } = navigationProps;

  const navRef = useRef<HTMLDivElement>(null); // Ref for the navbar
  const logoRef = useRef<HTMLImageElement>(null); // Ref for the logo

  const { isScrolled } = useScrolled();

  const { isMobile } = useIsMobile();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const params = useSearchParams();

  const sheetOpen = isMobile ? isSheetOpen : false;
  const handleSheetOpenChange = (open: boolean) => {
    if (isMobile) {
      setIsSheetOpen(open);
    }
  };

  const [hasScrolled, markAsScrolled] = useReducer(() => true, false);

  useEffect(() => {
    if (isScrolled && !hasScrolled) {
      markAsScrolled();
    }
  }, [isScrolled, hasScrolled]);

  const hasScrolledValue = isScrolled || hasScrolled;

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
        `pointer-events-none w-full mx-auto sm:landscape:px-4 md:landscape:px-8 px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 z-50 ${isScrolled ? "scrolled" : ""}`,
        // Always use backdrop blur for consistent appearance
        "backdrop-blur-xs landscape:backdrop-blur-none md:landscape:backdrop-blur-xs",
        // Always use sticky positioning to prevent jumping
        "sticky top-0",
        options?.removeBottomPadding ? "mb-3" : "mb-3 sm:mb-10",
        options?.fullWidth ? "max-w-[1920px]" : "max-w-screen-2xl"
      )}
    >
      <div
        className={cn(
          "mx-auto max-w-screen-2xl ",
          options?.removeBottomPadding ? "pt-4 lg:pt-8" : "py-4 lg:py-8",
          options?.fullWidth ? "max-w-[1920px]" : "max-w-screen-2xl"
        )}
      >
        {/* Desktop Navigation - Sticky by Default */}
        <div className="hidden w-full items-center justify-center gap-6 lg:flex pointer-events-auto">
          {logo && (
            <Link href={logo.url}>
              <Image
                ref={logoRef}
                className={cn(
                  "logo transition-all duration-500",
                  hasScrolledValue || pathname === "/"
                    ? "logo-small"
                    : "logo-large"
                )}
                src={logo.src}
                alt={logo.alt}
                width={153}
                height={175}
                priority
              />
            </Link>
          )}
          <NavigationMenu
            key={menu?.length || 0}
            delayDuration={0}
            viewport={false}
          >
            <NavigationMenuList>
              {menu?.map((m) => renderMenuItem(m, params))}
            </NavigationMenuList>
          </NavigationMenu>
          <div className="ml-auto space-x-4">
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
      className="w-full"
    >
      <NavigationMenuList className="grid w-[200px] list-none flex-col items-start justify-start gap-4">
        {items.map((component, index) => {
          const value = component.url || `${keyPrefix}-${index}`;
          if (component.items) {
            return (
              <NavigationMenuItem
                key={value}
                value={value}
                className="relative z-[100]"
              >
                <NavigationMenuTrigger
                  hideChevron
                  className="pl-2 text-kanaliiga-orange"
                >
                  {component.title}
                  <ChevronRight
                    className="ml-1 size-3 shrink-0 opacity-70"
                    aria-hidden
                  />
                </NavigationMenuTrigger>
                <NavigationMenuContent className="!left-full !top-0 z-[100] min-w-[200px] w-auto shadow-lg">
                  <ul className="grid gap-1">
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
            <NavigationMenuItem key={value} value={value}>
              <NavigationMenuLink asChild>
                <Link
                  href={{
                    pathname: component.url,
                    query: component.hasFilters ? params.toString() : undefined
                  }}
                  className="flex flex-row items-center gap-2"
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
          className="text-kanaliiga-orange"
        >
          {item.title}
        </NavigationMenuTrigger>
        <NavigationMenuContent className="group-data-[viewport=false]/navigation-menu:!overflow-visible">
          {renderMenuContent(item.items, params, item.title)}
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
    <li>
      <NavigationMenuLink asChild>
        <Link
          href={{
            pathname: href,
            query: params ? params.toString() : undefined
          }}
          className="flex flex-row items-center gap-2"
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
        >
          {title} {icon}
        </Link>
      </NavigationMenuLink>
    </li>
  );
};
