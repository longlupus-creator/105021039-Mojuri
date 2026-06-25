import { Outlet } from 'react-router-dom'
import Header from './105021039-Header'
import Footer from './105021039-Footer'
import UiTemplateParts from './105021039-UiTemplateParts'

export default function Layout() {
  return (
    <>
      <div id="page" className="hfeed page-wrapper">
        <Header />
        <Outlet />
        <Footer />
      </div>
      <UiTemplateParts />
    </>
  )
}
