/**
 * @copyright 2025 cyberavaz
 * @license Apache-2.0
 */

// Node modules
import { useEffect, useState } from "react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { MenuIcon } from "lucide-react";

import { useSiteContent } from '@/context/ContentContext.hooks';

export const Sidebar = () => {
    const { navLinks, socialLinks } = useSiteContent();
    const [active, setActive] = useState<string>('#hero');

    useEffect(() => {
        const sections = navLinks
            .map((link) => document.querySelector(link.link))
            .filter((el): el is Element => Boolean(el));

        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

                if (visible?.target.id) {
                    setActive(`#${visible.target.id}`);
                }
            },
            { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5, 1] },
        );

        sections.forEach((section) => observer.observe(section));

        return () => observer.disconnect();
    }, [navLinks]);

    return <>
    <Sheet>
        <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="mt-4 fixed top-4 right-4 z-50 border-2 hover:border-primary bg-neutral-800 py-5 px-5 rounded-full hover:text-primary cursor-pointer">
                <MenuIcon size={30}/>
            </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-84 bg-neutral-900 text-white py-6 pl-10" >
            <SheetTitle className="text-lg font-semibold">Menu</SheetTitle>

            <nav className="flex flex-col gap-4">
                {navLinks.map((link) => {
                    const Icon = link.icon;

                    return (
                        <SheetClose asChild key={link.label}>
                            <a
                                href={link.link}
                                onClick={() => setActive(link.link)}
                                className={cn(
                                    'text-neutral-300 flex items-center gap-2 hover:text-primary transition-colors duration-200 text-base',
                                    active === link.link && 'text-primary',
                                )}
                            >
                                <Icon className="size-4" /> {link.label}
                            </a>
                        </SheetClose>
                    );
                })}
            </nav>
            <div className="mt-30">
                <p className="pb-2">Socials</p>
                <div className="flex gap-3 text-neutral-500">
                    {socialLinks.map((social) => {
                        const Icon = social.icon;
                        return(
                            <a
                                key={social.label}
                                href={social.link}
                                aria-label={social.label}
                                target="_blank"
                                rel="noreferrer noopener"
                                className="hover:text-primary transition-colors"
                            >
                                <Icon className='size-4'/>
                            </a>
                        )
                    })}
                </div>
            </div>
        </SheetContent>
    </Sheet>
    </>;
}