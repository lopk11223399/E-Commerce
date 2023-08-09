import React from "react"
// Outlet: đại diện cho phần con của Public trên đường dẫn URL
import { Outlet } from "react-router-dom"
import { Header, Navigation, TopHeader, Footer } from "../../components"

function Public() {
  return (
    <div className="w-full flex flex-col items-center">
      <TopHeader />
      <Header />
      <Navigation />
      <div className="w-main">
        <Outlet />
      </div>
      <Footer />
    </div>
  )
}

export default Public
