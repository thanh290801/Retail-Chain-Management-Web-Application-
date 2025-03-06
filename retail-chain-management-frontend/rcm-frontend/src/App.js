import logo from './logo.svg';
import './App.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AddProductComponent from './components/warehouses/addProduct';
import WarehouseManagementComponent from './components/warehouses/warehouseManagement';
import OrderCheckComponent from './components/warehouses/orderCheck';
import WarehouseTransferComponent from './components/warehouses/WareHouseTransfer';
import ProductStockComponent from './components/warehouses/listProduct';
import ProductListComponent from './components/warehouses/listAllProduct';
import OrderListComponent from './components/warehouses/orderList';
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
