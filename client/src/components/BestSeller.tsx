import React, { useEffect, useState } from "react"
import { apiGetProducts } from "../apis/product"
import { Product } from "./"
import Slider from "react-slick"

const tabs = [
  { id: 1, name: "best seller" },
  { id: 2, name: "news arrivals" },
]

const settings = {
  dots: false, // index
  infinite: true, // lướt tới thằng cuối tự lướt lại
  speed: 500, // tốc độ lướt
  slidesToShow: 3, // số lượng item show mỗi lần lướt
  slidesToScroll: 1, // khi click thì sẽ lướt theo số lượng
}

const BestSeller = () => {
  const [bestSellers, setBestSellers] = useState(null)
  const [newProducts, setNewProducts] = useState(null)
  const [activeTab, setActiveTab] = useState(1)
  const [products, setProducts] = useState(null)

  const fetchProducts = async () => {
    const response = await Promise.all([
      apiGetProducts({ sort: "-sold" }),
      apiGetProducts({ sort: "-createdAt" }),
    ])

    if (response[0]?.success) {
      setBestSellers(response[0].products)
      setProducts(response[0].products)
    }
    if (response[1]?.success) setNewProducts(response[1].products)
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    if (activeTab === 1) setProducts(bestSellers)
    if (activeTab === 2) setProducts(newProducts)
  }, [activeTab])

  return (
    <div>
      <div className="flex text-[20px] ml-[-32px]">
        {tabs.map((el) => (
          <span
            key={el.id}
            className={`font-semibold capitalize px-8 border-r cursor-pointer text-gray-400 ${
              activeTab === el.id ? "text-gray-900" : ""
            }`}
            onClick={() => setActiveTab(el.id)}
          >
            {el.name}
          </span>
        ))}
      </div>
      <div className="mt-4 mx-[-10px] border-t-2 border-main pt-4">
        <Slider {...settings}>
          {products?.map((el) => (
            <Product
              key={el.id}
              productData={el}
              isNew={activeTab === 1 ? false : true}
            />
          ))}
        </Slider>
      </div>
    </div>
  )
}

export default BestSeller