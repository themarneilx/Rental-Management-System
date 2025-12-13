"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  LayoutDashboard, 
  Receipt, 
  User, 
  LogOut, 
  ArrowRight, 
  Calendar, 
  CreditCard, 
  Camera, 
  Check, 
  Menu, 
  FileText, 
  X,
  Upload, 
  Image as ImageIcon,
  Clock,
  AlertTriangle // Added AlertTriangle for confirmation modal
} from 'lucide-react';
import { MOCK_TENANT_USER, MOCK_TENANT_INVOICES, TenantUser } from '@/data/mock';
import Badge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button'; // Re-using the Button component
import ModalPortal from '@/components/ui/ModalPortal';

export default function TenantDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('home');
  const [userData, setUserData] = useState<TenantUser>(MOCK_TENANT_USER);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [hasPendingPayment, setHasPendingPayment] = useState(false); // State for pending status

  const handleLogout = () => {
    // In a real app, clear cookies/tokens here
    router.push('/login');
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserData({ ...userData, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaymentSuccess = () => {
      setHasPendingPayment(true);
  };

  const SidebarItem = ({ id, icon: Icon, label }: { id: string, icon: any, label: string }) => (
    <button 
      onClick={() => { setActiveTab(id); setSidebarOpen(false); }}
      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all ${ 
        activeTab === id 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <Icon className="w-5 h-5" />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#0B1121] border-r border-slate-800 transform transition-transform duration-200 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} flex flex-col`}>
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold mr-3">N</div>
          <span className="font-bold text-lg text-white tracking-tight">Nicarjon</span>
        </div>
        
        <div className="p-4 space-y-1 flex-1">
          <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 mt-2">Menu</p>
          <SidebarItem id="home" icon={LayoutDashboard} label="Overview" />
          <SidebarItem id="billing" icon={Receipt} label="My Bills" />
          <SidebarItem id="profile" icon={User} label="My Profile" />
        </div>

        <div className="p-4 border-t border-slate-800">
          <Button onClick={handleLogout} variant="ghost" className="w-full text-rose-400 hover:text-rose-300">
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0 h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-slate-600">
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-4 ml-auto">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-700 hidden sm:block">{userData.name}</span>
              <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden">
                {userData.avatar ? (
                  <img src={userData.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold text-xs">
                    {userData.name.charAt(0)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-5xl mx-auto">
            
            {/* --- HOME TAB --- */}
            {activeTab === 'home' && (
              <div className="space-y-6 animate-slide-in">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Welcome back, {userData.name.split(' ')[0]}!</h1>
                  <p className="text-slate-500">Here's what's happening with your unit today.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Unit Card */}
                  <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg shadow-blue-900/20">
                    <div className="flex items-start justify-between mb-8">
                      <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium backdrop-blur-sm">Occupied</span>
                    </div>
                    <div>
                      <p className="text-blue-100 text-sm font-medium mb-1">Current Unit</p>
                      <h3 className="text-3xl font-bold">Unit {userData.unitName}</h3>
                      <p className="text-blue-200 text-sm mt-1">{userData.building}</p>
                    </div>
                  </div>

                  {/* Balance Card - UPDATED WITH PAY NOW */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-start justify-between mb-6">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                            <CreditCard className="w-6 h-6" />
                        </div>
                        </div>
                        <div>
                        <p className="text-slate-500 text-sm font-medium mb-1">Total Due</p>
                        <h3 className="text-3xl font-bold text-slate-900">₱18,000</h3>
                        <p className="text-amber-600 text-sm mt-1 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Due Feb 28
                        </p>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100">
                        <Button 
                            disabled={hasPendingPayment}
                            onClick={() => !hasPendingPayment && setIsPaymentModalOpen(true)}
                            className="w-full py-2"
                            variant={hasPendingPayment ? 'outline' : 'primary'}
                            icon={hasPendingPayment ? Clock : ArrowRight}
                        >
                            {hasPendingPayment ? 'Pending' : 'Pay Now'}
                        </Button>
                    </div>
                  </div>

                  {/* Lease Card */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                    <div className="flex items-start justify-between mb-8">
                      <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                        <Calendar className="w-6 h-6" />
                      </div>
                    </div>
                    <div>
                      <p className="text-slate-500 text-sm font-medium mb-1">Lease Ends</p>
                      <h3 className="text-3xl font-bold text-slate-900">Dec 31</h3>
                      <p className="text-slate-400 text-sm mt-1">2025</p>
                    </div>
                  </div>
                </div>

                {/* Recent Invoices Preview */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-slate-900">Recent Billing History</h3>
                    <Button onClick={() => setActiveTab('billing')} variant="ghost" className="text-sm">
                      View All <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {MOCK_TENANT_INVOICES.map((inv) => (
                      <div key={inv.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-500">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">Rent & Utilities</p>
                            <p className="text-xs text-slate-500">{inv.period}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-900">₱{inv.total.toLocaleString()}</p>
                          <Badge status={inv.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* --- BILLING TAB --- */}
            {activeTab === 'billing' && (
              <div className="space-y-6 animate-slide-in">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Billing History</h1>
                        <p className="text-slate-500">View detailed breakdown of your rent and utilities.</p>
                    </div>
                    <Button 
                        disabled={hasPendingPayment}
                        onClick={() => !hasPendingPayment && setIsPaymentModalOpen(true)}
                        className="py-2"
                        variant={hasPendingPayment ? 'outline' : 'primary'}
                        icon={hasPendingPayment ? Clock : CreditCard}
                    >
                        {hasPendingPayment ? 'Pending' : 'Pay Now'}
                    </Button>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-4">Invoice ID</th>
                          <th className="px-6 py-4">Period</th>
                          <th className="px-6 py-4 text-right">Rent</th>
                          <th className="px-6 py-4 text-right">Water</th>
                          <th className="px-6 py-4 text-right">Electric</th>
                          <th className="px-6 py-4 text-right">Total</th>
                          <th className="px-6 py-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {MOCK_TENANT_INVOICES.map((inv) => (
                          <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-mono text-slate-500">{inv.id}</td>
                            <td className="px-6 py-4 font-medium text-slate-900">{inv.period}</td>
                            <td className="px-6 py-4 text-right text-slate-600">₱{inv.rent.toLocaleString()}</td>
                            <td className="px-6 py-4 text-right text-slate-600">₱{inv.water.toLocaleString()}</td>
                            <td className="px-6 py-4 text-right text-slate-600">₱{inv.elec.toLocaleString()}</td>
                            <td className="px-6 py-4 text-right font-bold text-slate-900">₱{inv.total.toLocaleString()}</td>
                            <td className="px-6 py-4 text-center"><Badge status={inv.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* --- PROFILE TAB --- */}
            {activeTab === 'profile' && (
              <div className="max-w-2xl animate-slide-in">
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
                  <p className="text-slate-500">Manage your personal information.</p>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
                  {/* Avatar Section */}
                  <div className="flex items-center gap-6 mb-8 pb-8 border-b border-slate-100">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-white shadow-md overflow-hidden">
                        {userData.avatar ? (
                          <img src={userData.avatar} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <User className="w-10 h-10" />
                          </div>
                        )}
                      </div>
                      <label className="absolute bottom-0 right-0 p-1.5 bg-blue-600 text-white rounded-full cursor-pointer hover:bg-blue-700 transition-colors shadow-sm">
                        <Camera className="w-4 h-4" />
                        <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                      </label>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{userData.name}</h3>
                      <p className="text-sm text-slate-500">Tenant • Unit {userData.unitName}</p>
                    </div>
                  </div>

                  {/* Editable Fields */}
                  <div className="space-y-6">
                    <h4 className="font-bold text-lg text-slate-900 mb-4">Contact Information</h4>
                    <form className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                                <input 
                                    type="email" 
                                    value={userData.email} 
                                    onChange={(e) => setUserData({...userData, email: e.target.value})}
                                    className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                                <input 
                                    type="text" 
                                    value={userData.phone} 
                                    onChange={(e) => setUserData({...userData, phone: e.target.value})}
                                    className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                />
                            </div>
                        </div>
                        <Button type="submit" className="mt-4">Save Changes</Button>
                    </form>

                    <h4 className="font-bold text-lg text-slate-900 mt-8 mb-4 pt-4 border-t border-slate-100">Change Password</h4>
                    <form className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                            <input type="password" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                            <input type="password" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                            <input type="password" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
                        </div>
                        <Button type="submit" className="mt-4" variant="outline">Change Password</Button>
                    </form>

                  </div>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <PaymentModal 
            user={userData} 
            onClose={() => setIsPaymentModalOpen(false)} 
            onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

// --- Sub-Components (Modals) ---

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }: { isOpen: boolean, onClose: () => void, onConfirm: () => void, title: string, message: string }) => {
    if (!isOpen) return null;

    return (
        <ModalPortal>
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-6 text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-amber-100 mb-4">
                            <AlertTriangle className="h-6 w-6 text-amber-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
                        <p className="text-sm text-slate-500 whitespace-pre-line">{message}</p>
                    </div>
                    <div className="bg-slate-50 px-4 py-3 flex justify-center gap-3">
                        <Button variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button onClick={onConfirm}>Confirm</Button>
                    </div>
                </div>
            </div>
        </ModalPortal>
    );
};

const PaymentModal = ({ onClose, user, onSuccess }: { onClose: () => void, user: TenantUser, onSuccess: () => void }) => {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone,
    message: '',
    receipt: null as File | null
  });
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFormData({ ...formData, receipt: e.target.files[0] });
    }
  };

  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsConfirmOpen(true);
  };

  const handleConfirmSubmit = () => {
    setIsConfirmOpen(false);
    // In a real app, upload logic would go here
    alert("Payment proof submitted successfully! Please wait for admin verification.");
    onSuccess();
    onClose();
  };

  return (
    <ModalPortal>
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                <h3 className="text-xl font-bold text-slate-900">Pay Bill & Submit Proof</h3>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-6">
                {/* Bank Info Card */}
                <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-100 rounded-full mix-blend-multiply filter blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                    
                    <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                       <Building2 className="w-4 h-4" /> Bank Transfer Details
                    </h4>
                    
                    <div className="space-y-3 text-sm text-blue-900 relative z-10">
                        <div className="flex justify-between items-center pb-2 border-b border-blue-100/50">
                            <span className="text-blue-600 font-medium">Bank Name</span>
                            <span className="font-bold">BDO Unibank</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-blue-100/50">
                            <span className="text-blue-600 font-medium">Account Name</span>
                            <span className="font-bold">Nicarjon Apartments</span>
                        </div>
                        <div className="flex justify-between items-center pt-1">
                            <span className="text-blue-600 font-medium">Account Number</span>
                            <span className="font-mono font-bold text-xl tracking-wide">0012-3456-7890</span>
                        </div>
                    </div>
                </div>

                {/* Contact Form */}
                <form onSubmit={handleInitialSubmit} className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider pt-2">Payment Confirmation Form</h4>
                    <p className="text-xs text-slate-500 -mt-3 mb-2">Please upload your transfer receipt so we can verify your payment.</p>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Full Name</label>
                            <input 
                                type="text" 
                                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
                                value={formData.name} 
                                onChange={e => setFormData({...formData, name: e.target.value})} 
                                required 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Phone Number</label>
                            <input 
                                type="text" 
                                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
                                value={formData.phone} 
                                onChange={e => setFormData({...formData, phone: e.target.value})} 
                                required 
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Email Address</label>
                        <input 
                            type="email" 
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
                            value={formData.email} 
                            onChange={e => setFormData({...formData, email: e.target.value})} 
                            required 
                        />
                    </div>
                    
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Message & Proof</label>
                        <div className="relative">
                            <textarea 
                                className="w-full p-3 border border-slate-200 rounded-lg text-sm h-32 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none pb-12" 
                                placeholder="I have transferred the payment for January Rent..."
                                value={formData.message}
                                onChange={e => setFormData({...formData, message: e.target.value})}
                            ></textarea>
                            
                            {/* Attachment Button inside Textarea */}
                            <div className="absolute bottom-2 left-2 right-2">
                                <input type="file" id="receipt-upload" className="hidden" accept="image/*" onChange={handleFileChange} required />
                                <label 
                                    htmlFor="receipt-upload" 
                                    className={`flex items-center justify-center gap-2 w-full p-2 rounded-md text-xs font-medium cursor-pointer transition-all border ${ 
                                        formData.receipt 
                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                                            : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                                    }`}
                                >
                                    {formData.receipt ? (
                                        <>
                                            <Check className="w-3.5 h-3.5" /> 
                                            Attached: {formData.receipt.name}
                                        </>
                                    ) : (
                                        <>
                                            <ImageIcon className="w-3.5 h-3.5" /> 
                                            Attach Receipt Image (Required)
                                        </>
                                    )}
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="pt-2">
                        <Button type="submit" className="w-full py-3" icon={ArrowRight}>
                            Submit Payment Proof
                        </Button>
                    </div>
                </form>
            </div>
        </div>
        
        {/* Nested Confirmation Modal */}
        <ConfirmationModal 
            isOpen={isConfirmOpen} 
            onClose={() => setIsConfirmOpen(false)}
            onConfirm={handleConfirmSubmit}
            title="Confirm Submission"
            message="Are you sure you want to submit this payment proof? You can only do this once.\n\nIf you make a mistake, you will need to contact us directly."
        />
    </div>
    </ModalPortal>
  );
};