import ProductCard from '../ProductCard'

export default function ProductCardExample() {
  return (
    <div className="max-w-md space-y-3">
      <ProductCard
        image="https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=200&h=200&fit=crop"
        title="Carson Dellosa First Words Flash Cards for Toddlers 2-4 Years"
        description="Educational learning toy"
      />
      <ProductCard
        image="https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=200&h=200&fit=crop"
        title="Talking Flash Cards for Toddlers 1 2 3 4 5 6 Years Old Educational Toys"
        description="Interactive learning cards"
      />
    </div>
  )
}
