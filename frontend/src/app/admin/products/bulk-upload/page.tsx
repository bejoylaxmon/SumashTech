'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { API_BASE } from '@/lib/api';
import { Upload, Download, FileSpreadsheet, Check, X, AlertCircle } from 'lucide-react';

export default function BulkUploadPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<{ success: number; failed: number; results: any[]; errors: any[] } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isAuthorized = useMemo(() => 
        user?.role === 'SUPER_ADMIN' || 
        user?.role === 'ADMIN' || 
        user?.role === 'MANAGER' || 
        user?.permissions?.includes('edit_product_full') ||
        user?.permissions?.includes('manage_inventory'),
        [user]
    );

    useEffect(() => {
        if (user && !isAuthorized) {
            router.push('/');
        }
    }, [user, isAuthorized, router]);

    if (!isAuthorized && user) return <div className="p-10 text-center text-secondary font-bold">Access Denied</div>;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
                setFile(selectedFile);
                setResult(null);
            } else {
                alert('Please upload an Excel file (.xlsx or .xls)');
            }
        }
    };

    const downloadTemplate = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/products/sample-template`);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'product_template.xlsx';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error('Failed to download template:', err);
            alert('Failed to download template. Please try again.');
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        const user = JSON.parse(localStorage.getItem('user') || '{}');

        try {
            const res = await fetch(`${API_BASE}/api/products/bulk-upload`, {
                method: 'POST',
                headers: {
                    'x-user-email': user.email
                },
                body: formData
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Upload failed');
            }
            setResult(data);
            setFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (err: any) {
            alert(err.message || 'Failed to upload');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black text-secondary uppercase tracking-wider">Bulk Product Upload</h1>
                    <p className="text-gray-400 text-sm mt-2">Upload multiple products from Excel file</p>
                </div>
                <button
                    onClick={downloadTemplate}
                    className="flex items-center gap-2 bg-green-600 text-black px-6 py-3 rounded-xl font-black uppercase tracking-wider hover:bg-green-700 transition-all shadow-lg shadow-green-600/30"
                >
                    <Download className="w-5 h-5" />
                    Download Sample
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Upload Section */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-[32px] p-8 shadow-lg border border-gray-100">
                        <h2 className="text-xl font-black text-secondary mb-6 flex items-center gap-2">
                            <Upload className="w-6 h-6 text-primary" />
                            Upload Excel File
                        </h2>

                        <div 
                            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${file ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/50'}`}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={handleFileChange}
                                className="hidden"
                                id="file-upload"
                            />
                            <label htmlFor="file-upload" className="cursor-pointer">
                                <div className="flex flex-col items-center">
                                    <FileSpreadsheet className={`w-16 h-16 mb-4 ${file ? 'text-primary' : 'text-gray-300'}`} />
                                    {file ? (
                                        <>
                                            <p className="text-secondary font-bold text-lg">{file.name}</p>
                                            <p className="text-gray-400 text-sm">Click to change file</p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-secondary font-bold text-lg">Click to upload Excel file</p>
                                            <p className="text-gray-400 text-sm">or drag and drop</p>
                                            <p className="text-gray-300 text-xs mt-2">.xlsx or .xls files only</p>
                                        </>
                                    )}
                                </div>
                            </label>
                        </div>

                        {file && (
                            <button
                                onClick={handleUpload}
                                disabled={uploading}
                                className="w-full mt-6 bg-primary text-black py-4 rounded-xl font-black uppercase tracking-wider hover:bg-orange-600 transition-all shadow-lg shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {uploading ? 'Uploading...' : 'Upload Products'}
                            </button>
                        )}
                    </div>

                    {/* Results */}
                    {result && (
                        <div className="bg-white rounded-[32px] p-8 shadow-lg border border-gray-100 mt-8">
                            <h2 className="text-xl font-black text-secondary mb-6">Upload Results</h2>
                            
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-green-50 p-6 rounded-2xl text-center">
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <Check className="w-6 h-6 text-green-600" />
                                        <span className="text-3xl font-black text-green-600">{result.success}</span>
                                    </div>
                                    <p className="text-green-700 font-bold text-sm uppercase">Products Added</p>
                                </div>
                                <div className="bg-red-50 p-6 rounded-2xl text-center">
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <X className="w-6 h-6 text-red-600" />
                                        <span className="text-3xl font-black text-red-600">{result.failed}</span>
                                    </div>
                                    <p className="text-red-700 font-bold text-sm uppercase">Failed</p>
                                </div>
                            </div>

                            {result.errors.length > 0 && (
                                <div>
                                    <h3 className="font-bold text-red-600 mb-3 flex items-center gap-2">
                                        <AlertCircle className="w-5 h-5" />
                                        Errors
                                    </h3>
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {result.errors.map((err, idx) => (
                                            <div key={idx} className="bg-red-50 p-3 rounded-lg text-sm">
                                                <span className="font-bold text-red-700">{err.name}:</span> {err.error}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Instructions */}
                <div>
                    <div className="bg-white rounded-[32px] p-8 shadow-lg border border-gray-100 sticky top-24">
                        <h2 className="text-xl font-black text-secondary mb-6">Instructions</h2>
                        
                        <div className="space-y-4">
                            <div className="flex gap-3">
                                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="font-black text-primary">1</span>
                                </div>
                                <div>
                                    <p className="font-bold text-secondary text-sm">Download Template</p>
                                    <p className="text-gray-400 text-xs">Click the button above to download the sample Excel template</p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="font-black text-primary">2</span>
                                </div>
                                <div>
                                    <p className="font-bold text-secondary text-sm">Fill the Data</p>
                                    <p className="text-gray-400 text-xs">Fill in product details, variants (storage, color, region), and specifications</p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="font-black text-primary">3</span>
                                </div>
                                <div>
                                    <p className="font-bold text-secondary text-sm">Upload File</p>
                                    <p className="text-gray-400 text-xs">Upload your completed Excel file using the upload button</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 p-4 bg-amber-50 rounded-xl">
                            <p className="text-amber-700 text-xs font-bold uppercase tracking-wider mb-2">Important Notes</p>
                            <ul className="text-amber-600 text-xs space-y-1">
                                <li>• Category and Brand must exist in the system</li>
                                <li>• Slug will be auto-generated if left empty</li>
                                <li>• Price is required for base price</li>
                                <li>• Storage/Color/Region variants are optional</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
