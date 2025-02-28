import './App.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AddProductComponent from './components/addProduct';
import ProductManagementComponent from './components/listProduct';
import Header from './headerComponent/header';
import LoginPage from './components/login';

import SalesChartPage from './sale-dashboadConponent/SalesChartPage';
import Filter from './sale-dashboadConponent/Filter';
import Dashboard from './sale-dashboadConponent/Dashboard';



function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path='/addproduct' element= {<AddProductComponent/>} />
          <Route path='/productmanage' element= {<ProductManagementComponent/>} />
          <Route path='/header' element= {<Header/>} />
          <Route path='/login' element= {<LoginPage/>} />
          <Route path='/filter' element= {<Filter/>} />
          <Route path='/home' element= {<SalesChartPage/>} />
          <Route path='/dashboard' element= {<Dashboard/>} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
