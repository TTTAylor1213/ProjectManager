import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import ProjectList from "./pages/ProjectList";
import DeviceList from "./pages/DeviceList";
import ShipmentList from "./pages/ShipmentList";
import RepairList from "./pages/RepairList";
import RdDeviceList from "./pages/RdDeviceList";
import SoftwareList from "./pages/SoftwareList";
import HardwareList from "./pages/HardwareList";
import PersonnelList from "./pages/PersonnelList";
import NoteList from "./pages/NoteList";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="projects" element={<ProjectList />} />
          <Route path="devices" element={<DeviceList />} />
          <Route path="shipments" element={<ShipmentList />} />
          <Route path="repairs" element={<RepairList />} />
          <Route path="rd-devices" element={<RdDeviceList />} />
          <Route path="software" element={<SoftwareList />} />
          <Route path="hardware" element={<HardwareList />} />
          <Route path="personnel" element={<PersonnelList />} />
          <Route path="notes" element={<NoteList />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
