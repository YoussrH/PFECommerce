"use client";
import Link from "next/link";
import { NavigationMenuLink } from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

export default function SubmenuFemme({ isOpen, onMouseEnter, onMouseLeave }) {
  const sections = [
    {
      title: "Vêtements",
      items: [
        { name: "Robes", href: "/store/femme/robes" },
        { name: "Hauts", href: "/store/femme/hauts" },
        { name: "Pantalons", href: "/store/femme/pantalons" },
        { name: "Jupes", href: "/store/femme/jupes" }
      ]
    },
    {
      title: "Accessoires",
      items: [
        { name: "Chaussures", href: "/store/femme/chaussures" },
        { name: "Sacs", href: "/store/femme/sacs" },
        { name: "Bijoux", href: "/store/femme/bijoux" }
      ]
    },
    {
      title: "Par Âge",
      items: [
        { name: "2-5 ans", href: "/store/femme/2-5-ans" },
        { name: "6-10 ans", href: "/store/femme/6-10-ans" },
        { name: "11-16 ans", href: "/store/femme/11-16-ans" }
      ]
    }
  ];

  return (
    <div className="grid grid-cols-3 gap-8 p-6 w-full max-w-6xl mx-auto">
      {sections.map((section) => (
        <div key={section.title}>
          <h3 className="text-lg font-medium mb-4">{section.title}</h3>
          <ul className="space-y-2">
            {section.items.map((item) => (
              <li key={item.name}>
                <Link href={item.href} legacyBehavior passHref>
                  <NavigationMenuLink className={cn(
                    "text-sm hover:text-primary transition-colors",
                    "block py-1.5 hover:underline"
                  )}>
                    {item.name}
                  </NavigationMenuLink>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}