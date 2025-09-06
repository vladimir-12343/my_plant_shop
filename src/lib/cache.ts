import { revalidatePath } from "next/cache"

/**
 * Инвалидация кеша для товаров и каталога
 * @param productId optional — если передать, инвалидируем и страницу конкретного товара
 */
export function invalidateProductsCache(productId?: number | string) {
  revalidatePath("/admin/products")
  revalidatePath("/")
  revalidatePath("/shop/all-plants")
  revalidatePath("/shop")

  if (productId) {
    revalidatePath(`/shop/${productId}`)
  }
}
