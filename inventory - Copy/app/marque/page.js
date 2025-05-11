import Image from "next/image"
import Link from "next/link"

export default function MarquesPage() {
  const brands = [
    {
      name: "BILLIEBLUSH",
      image: "/placeholder.svg?height=400&width=600",
      slug: "billieblush",
    },
    {
      name: "BOSS",
      image: "/placeholder.svg?height=400&width=600",
      slug: "boss",
    },
    {
      name: "CHLOÉ",
      image: "/placeholder.svg?height=400&width=600",
      slug: "chloe",
    },
    {
      name: "DKNY",
      image: "/placeholder.svg?height=400&width=600",
      slug: "dkny",
    },
    {
      name: "GIVENCHY",
      image: "/placeholder.svg?height=400&width=600",
      slug: "givenchy",
    },
    {
      name: "HUGO",
      image: "/placeholder.svg?height=400&width=600",
      slug: "hugo",
    },
    {
      name: "KARL LAGERFELD KIDS",
      image: "/placeholder.svg?height=400&width=600",
      slug: "karl-lagerfeld",
    },
    {
      name: "KENZO KIDS",
      image: "/placeholder.svg?height=400&width=600",
      slug: "kenzo",
    },
  ]

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-16">
        <h1 className="text-3xl font-bold uppercase mb-8">MARQUES</h1>
        <div className="max-w-3xl mx-auto space-y-4 text-center text-gray-700">
          <p>
            Kids around propose sur son site un condensé de la <span className="font-semibold">mode enfant</span>,
            découvrez les collections des plus belles{" "}
            <span className="font-semibold">marques de vêtement pour enfant</span>, de la naissance à 16 ans.
          </p>
          <p>
            Grâce à leur savoir-faire incontestable, Karl Lagerfeld Kids, Lanvin et Givenchy proposent un vestiaire
            tendance pour habiller vos enfants pour toutes les occasions. Craquez pour l&apos;élégance de la marque
            Zadig&Voltaire, la touche de folie de Billieblush, le sportswear de BOSS et le glamour de Michael Kors.
          </p>
          <p>
            Découvrez le confort de Timberland, le style streetwear tendance de DKNY et HUGO, et l&apos;élégance
            parisienne de Sonia Rykiel. Avec Kenzo Kids et Marc Jacobs, plongez dans des univers décalés. Et pour finir,
            découvrez les dernières arrivées, la marque de luxe Chloé.
          </p>
          <p className="mt-6">
            Les <span className="font-semibold">marques enfant</span> proposent des styles pour toutes les
            personnalités. Parce que les enfants sont plein de fantaisies, les créateurs redoublent d&apos;ingéniosité à
            chaque collection pour concevoir des pièces pratiques, confortables et résistantes, adaptées à la vraie vie
            des enfants.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {brands.map((brand) => (
          <div key={brand.slug} className="relative group overflow-hidden">
            <div className="relative h-[400px] w-full overflow-hidden">
              <Image
                src={brand.image || "/placeholder.svg"}
                alt={brand.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                priority
              />
              <div className="absolute inset-0 bg-black bg-opacity-10"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center z-10">
                <div className="bg-white bg-opacity-80 p-6 min-w-[200px]">
                  <h2 className="text-2xl font-bold mb-4">{brand.name}</h2>
                  <Link
                    href={`/marques/${brand.slug}`}
                    className="inline-block border border-black px-8 py-2 text-sm uppercase hover:bg-black hover:text-white transition-colors duration-300"
                  >
                    DÉCOUVRIR
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
