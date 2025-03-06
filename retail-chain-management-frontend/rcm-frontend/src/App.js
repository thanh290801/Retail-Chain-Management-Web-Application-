import './App.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AddProductComponent from './components/addProduct';
import ProductManagementComponent from './components/listProduct';
import StockCheckComponent from './components/warehouses/stockCheck';

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
        <Route path='/addproduct' element= {<AddProductComponent/>} />
          <Route path='/productstock' element= {<ProductStockComponent/>} />
          <Route path='/warehousemanagement' element= {<WarehouseManagementComponent/>} />
          <Route path='/ordercheck/:orderId' element= {<OrderCheckComponent/>} />
          <Route path='/warehousetransfer' element= {<WarehouseTransferComponent/>} />
          <Route path='/listallproduct' element= {<ProductListComponent/>} />
          <Route path='/orderlist' element= {<OrderListComponent/>} />
          <Route path='/stockcheck' element= {<StockCheckComponent/>} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
