const path = {
  PUBLIC: "/",
  HOME: "",
  ALL: "*",
  LOGIN: "login",
  PRODUCTS__CATEGORY: ":category",
  PRODUCTS: "products",
  BLOGS: "blogs",
  OUR_SERVICES: "services",
  FAQ: "faq",
  DETAIL_PRODUCT__CATEGORY__PID__TITLE: ":category/:pid/:title",
  FINAL_REGISTER: "finalregister/:status",
  RESET_PASSWORD: "reset-password/:token",
  DETAIL_CART: "my-cart",
  CHECKOUT: "checkout",

  // Admin
  ADMIN: "admin",
  DASHBOARD: "dashboard",
  MANAGE_USERS: "manage-users",
  MANAGE_PRODUCTS: "manage-products",
  MANAGE_ORDERS: "manage-orders",
  CREATE_PRODUCTS: "create-products",

  // Member
  MEMBER: "member",
  PERSONAL: "personal",
  MY_CART: "my-cart",
  HISTORY: "buy-history",
  WISHLIST: "wishlist",
}

export default path
