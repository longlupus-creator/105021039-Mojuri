import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import Layout from './components/105021039-Layout'
import Home from './pages/105021039-Home'
import Home2 from './pages/105021039-Home2'
import Home3 from './pages/105021039-Home3'
import Home4 from './pages/105021039-Home4'
import Home5 from './pages/105021039-Home5'
import Home6 from './pages/105021039-Home6'
import Home7 from './pages/105021039-Home7'
import Home8 from './pages/105021039-Home8'
import Shop from './pages/105021039-Shop'
import ShopGridLeft from './pages/105021039-ShopGridLeft'
import ShopGridRight from './pages/105021039-ShopGridRight'
import ShopListLeft from './pages/105021039-ShopListLeft'
import ShopListRight from './pages/105021039-ShopListRight'
import Product from './pages/105021039-Product'
import Cart from './pages/105021039-Cart'
import Checkout from './pages/105021039-Checkout'
import Wishlist from './pages/105021039-Wishlist'
import BlogList from './pages/105021039-BlogList'
import BlogGridLeft from './pages/105021039-BlogGridLeft'
import BlogGridRight from './pages/105021039-BlogGridRight'
import BlogListLeft from './pages/105021039-BlogListLeft'
import BlogListRight from './pages/105021039-BlogListRight'
import BlogDetail from './pages/105021039-BlogDetail'
import BlogDetailLeft from './pages/105021039-BlogDetailLeft'
import BlogDetailRight from './pages/105021039-BlogDetailRight'
import About from './pages/105021039-About'
import Contact from './pages/105021039-Contact'
import Faq from './pages/105021039-Faq'
import Login from './pages/105021039-Login'
import ForgotPassword from './pages/105021039-ForgotPassword'
import Account from './pages/105021039-Account'
import Page404 from './pages/105021039-Page404'
import AdminDashboard from './pages/admin/AdminDashboard'
import { loadTemplateScripts, refreshTemplateEffects } from './services/templateScripts'
import './App.css'

function TemplateScriptLoader() {
  const location = useLocation()

  useEffect(() => {
    loadTemplateScripts()
      .then(() => setTimeout(refreshTemplateEffects, 150))
      .catch(console.error)
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    if (window.__mojuriScriptsLoaded) {
      setTimeout(refreshTemplateEffects, 150)
    }
  }, [location.pathname])

  return null
}

export default function App() {
  return (
    <>
      <TemplateScriptLoader />
      <Routes>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/home-2" element={<Home2 />} />
          <Route path="/home-3" element={<Home3 />} />
          <Route path="/home-4" element={<Home4 />} />
          <Route path="/home-5" element={<Home5 />} />
          <Route path="/home-6" element={<Home6 />} />
          <Route path="/home-7" element={<Home7 />} />
          <Route path="/home-8" element={<Home8 />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/shop-grid-left" element={<ShopGridLeft />} />
          <Route path="/shop-grid-right" element={<ShopGridRight />} />
          <Route path="/shop-list-left" element={<ShopListLeft />} />
          <Route path="/shop-list-right" element={<ShopListRight />} />
          <Route path="/product" element={<Product />} />
          <Route path="/product/:slug" element={<Product />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/blog" element={<BlogList />} />
          <Route path="/blog-grid-left" element={<BlogGridLeft />} />
          <Route path="/blog-grid-right" element={<BlogGridRight />} />
          <Route path="/blog-list-left" element={<BlogListLeft />} />
          <Route path="/blog-list-right" element={<BlogListRight />} />
          <Route path="/blog-detail" element={<BlogDetail />} />
          <Route path="/blog/:slug" element={<BlogDetail />} />
          <Route path="/blog-detail-left" element={<BlogDetailLeft />} />
          <Route path="/blog-detail-right" element={<BlogDetailRight />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/account" element={<Account />} />
          <Route path="/404" element={<Page404 />} />
          <Route path="*" element={<Page404 />} />
        </Route>
      </Routes>
    </>
  )
}
