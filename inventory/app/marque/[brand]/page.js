import Image from "next/image"
import Link from "next/link"

export default function BrandPage({ params }) {
  const { brand } = params

  // This would typically come from a database or API
  const brandData = {
    billieblush: {
      name: "BILLIEBLUSH",
      description:
        "La marque BILLIEBLUSH combine créativité, couleurs et confort. Avec des designs ludiques et des détails adorables, elle offre aux petites filles des tenues pleines de charme, idéales pour exprimer leur personnalité.",
      heroImage: "/images/brands/billieblush-hero.jpg",
      categories: [
        {
          name: "LES HAUTS",
          description:
            "Les hauts de la collection enfant BILLIEBLUSH apportent une touche de fun et de fraîcheur à chaque tenue. Avec des couleurs vives, des imprimés ludiques et des détails tendance, ces pièces alliant confort et style pour des looks à la fois modernes et pleins de personnalité.",
          image: "/images/categories/billieblush-tops.jpg",
        },
        {
          name: "LES ROBES",
          description:
            "Les robes de la collection enfant BILLIEBLUSH allient élégance et fantaisie, avec des tissus doux, des couleurs pétillantes et des détails charmants. Parfaites pour toutes les occasions, elles apportent une touche de magie et de joie au quotidien des petites amoureuses de mode.",
          image: "/images/categories/billieblush-dresses.jpg",
        },
        {
          name: "LES ACCESSOIRES",
          description:
            "Les accessoires de la collection enfant BILLIEBLUSH ajoutent une touche ludique et colorée à chaque tenue. Avec des détails scintillants et des motifs amusants, ces pièces parfaites viennent sublimer le style des petites avec une touche de fun.",
          image: "/images/categories/billieblush-accessories.jpg",
        },
      ],
    },
    // Other brands would be defined here
  }

  const currentBrand = brandData[brand] || {
    name: brand.toUpperCase(),
    description: "Description de la marque à venir.",
    heroImage: "/images/placeholder.jpg",
    categories: [],
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-4">
        <Link href="/marques" className="text-gray-600 hover:underline">
          Accueil
        </Link>{" "}
        &gt;{" "}
        <Link href="/marques" className="text-gray-600 hover:underline">
          Marques
        </Link>{" "}
        &gt; {currentBrand.name}
      </div>

      <div className="text-center mb-16">
        <h1 className="text-3xl font-bold mb-8">LA MARQUE {currentBrand.name}</h1>
        <p className="max-w-3xl mx-auto text-gray-700">{currentBrand.description}</p>
        <div className="mt-8">
          <Link
            href={`/marques/${brand}/collection`}
            className="inline-block border border-black px-8 py-3 text-sm uppercase hover:bg-black hover:text-white transition-colors duration-300"
          >
            DÉCOUVRIR LA MARQUE
          </Link>
        </div>
      </div>

      {currentBrand.categories.length > 0 && (
        <div className="mt-24">
          <h2 className="text-2xl font-bold text-center mb-16">
            BILLIEBLUSH : UN UNIVERS PÉTILLANT, COLORÉ ET POÉTIQUE.
          </h2>
          <p className="text-center mb-12">
            Plongez dans l&apos;univers de Billieblush, où couleurs, confort et créativité se rencontrent
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {currentBrand.categories.map((category, index) => (
              <div key={index} className="text-center">
                <div className="relative h-[400px] w-full mb-6">
                  <Image
                    src={category.image || "/placeholder.svg?height=400&width=300"}
                    alt={category.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <h3 className="text-xl font-bold mb-4">{category.name}</h3>
                <p className="text-sm text-gray-700 mb-6">{category.description}</p>
                <Link
                  href={`/marques/${brand}/collection/${category.name.toLowerCase().replace(/\s+/g, "-")}`}
                  className="inline-block border border-black px-8 py-2 text-sm uppercase hover:bg-black hover:text-white transition-colors duration-300"
                >
                  DÉCOUVRIR
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-24 text-center">
        <h2 className="text-2xl font-bold mb-8">LES ESSENTIELS DE LA COLLECTION</h2>
        <p className="max-w-3xl mx-auto text-gray-700">
          Découvrez la collection Billieblush, une parfaite alliance de couleurs vives et de styles ludiques.
        </p>
      </div>
    </div>
  )
}
