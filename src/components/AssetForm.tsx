import { useState, useEffect, useRef, useCallback } from 'react';

interface Company {
  id: number;
  name: string;
}

interface Model {
  id: number;
  name: string;
  manufacturer?: { name: string };
}

interface Status {
  id: number;
  name: string;
}

interface Location {
  id: number;
  name: string;
}

interface Manufacturer {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
}

interface AssetFormProps {
  apiUrl: string;
  accessToken: string;
}

export default function AssetForm({ apiUrl, accessToken }: AssetFormProps) {
  const [assetTag, setAssetTag] = useState('');
  const [assetName, setAssetName] = useState('');
  const [assetNameManuallyEdited, setAssetNameManuallyEdited] = useState(false);
  const [serial, setSerial] = useState('');
  const [notes, setNotes] = useState('');
  const [requestable, setRequestable] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companySearch, setCompanySearch] = useState('');
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);

  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [modelSearch, setModelSearch] = useState('');
  const [showModelDropdown, setShowModelDropdown] = useState(false);

  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [selectedManufacturer, setSelectedManufacturer] = useState<Manufacturer | null>(null);
  const [manufacturerSearch, setManufacturerSearch] = useState('');
  const [showManufacturerDropdown, setShowManufacturerDropdown] = useState(false);
  const [showManufacturerField, setShowManufacturerField] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categorySearch, setCategorySearch] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [highlightedCategory, setHighlightedCategory] = useState(0);

  const [statuses, setStatuses] = useState<Status[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<Status | null>(null);

  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [locationSearch, setLocationSearch] = useState('');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isLoadingManufacturers, setIsLoadingManufacturers] = useState(false);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);

  const [highlightedCompany, setHighlightedCompany] = useState(0);
  const [highlightedModel, setHighlightedModel] = useState(0);
  const [highlightedManufacturer, setHighlightedManufacturer] = useState(0);
  const [highlightedLocation, setHighlightedLocation] = useState(0);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [pendingStream, setPendingStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const companyRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<HTMLDivElement>(null);
  const manufacturerRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNextAssetTag();
    fetchStatuses();
  }, [apiUrl, accessToken]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (companyRef.current && !companyRef.current.contains(event.target as Node)) {
        setShowCompanyDropdown(false);
      }
      if (modelRef.current && !modelRef.current.contains(event.target as Node)) {
        setShowModelDropdown(false);
      }
      if (manufacturerRef.current && !manufacturerRef.current.contains(event.target as Node)) {
        setShowManufacturerDropdown(false);
      }
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(false);
      }
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
        setShowLocationDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => { setHighlightedCompany(0); }, [companies]);
  useEffect(() => { setHighlightedModel(0); }, [models]);
  useEffect(() => { setHighlightedManufacturer(0); }, [manufacturers]);
  useEffect(() => { setHighlightedCategory(0); }, [categories]);
  useEffect(() => { setHighlightedLocation(0); }, [locations]);

  const fetchNextAssetTag = async () => {
    try {
      // Fetch latest assets to determine next tag
      const res = await fetch(`${apiUrl}/hardware?sort=created_at&order=desc&limit=1`, {
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' },
      });
      const data = await res.json();
      if (data.rows && data.rows.length > 0) {
        const lastTag = data.rows[0].asset_tag;
        // Simple increment logic for demo - in production you might want the logic from next-asset-tag.ts
        const match = lastTag.match(/(\d+)/);
        if (match) {
          const num = parseInt(match[0], 10) + 1;
          const nextTag = lastTag.replace(match[0], num.toString().padStart(match[0].length, '0'));
          setAssetTag(nextTag);
        }
      }
    } catch (e) {
      console.error('Failed to fetch next asset tag', e);
    }
  };

  const fetchStatuses = async () => {
    try {
      const res = await fetch(`${apiUrl}/statuslabels?limit=100`, {
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' },
      });
      const data = await res.json();
      if (data.rows) {
        setStatuses(data.rows);
        if (data.rows.length > 0) {
          setSelectedStatus(data.rows[0]);
        }
      }
    } catch (e) {
      console.error('Failed to fetch statuses', e);
    }
  };

  const searchCompanies = useCallback(async (search: string = '') => {
    setIsLoadingCompanies(true);
    try {
      const res = await fetch(`${apiUrl}/companies?search=${encodeURIComponent(search)}&limit=50`, {
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' },
      });
      const data = await res.json();
      if (data.rows) {
        const filtered = data.rows.filter((c: Company) =>
          c.name.toLowerCase().includes(search.toLowerCase())
        );
        const exactMatch = filtered.find((c: Company) => c.name.toLowerCase() === search.toLowerCase());
        if (exactMatch) {
          setSelectedCompany(exactMatch);
          setCompanySearch(exactMatch.name);
          setShowCompanyDropdown(false);
        } else {
          setCompanies(filtered);
          setShowCompanyDropdown(filtered.length > 0);
        }
      }
    } catch (e) {
      console.error('Failed to search companies', e);
    } finally {
      setIsLoadingCompanies(false);
    }
  }, [apiUrl, accessToken]);

  // Helper for Unicode-aware case-insensitive comparison
  const normalizeString = (str: string) => str.toLowerCase().normalize('NFC');

  const searchModels = useCallback(async (search: string = '') => {
    setIsLoadingModels(true);
    try {
      const res = await fetch(`${apiUrl}/models?search=${encodeURIComponent(search)}&limit=50`, {
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' },
      });
      const data = await res.json();
      if (data.rows) {
        const normalizedSearch = normalizeString(search);
        const filtered = data.rows.filter((m: Model) =>
          normalizeString(m.name).includes(normalizedSearch)
        );
        // Check for exact match in all results (not just when there's only 1)
        const exactMatch = filtered.find((m: Model) =>
          normalizeString(m.name) === normalizedSearch
        );
        if (exactMatch) {
          handleModelSelect(exactMatch);
          setShowManufacturerField(false);
          setShowModelDropdown(false);
        } else {
          setModels(filtered);
          // Show manufacturer field if:
          // 1. There's a search term AND
          // 2. No exact match exists in the results (including when no results at all)
          const hasExactMatchInResults = filtered.some((m: Model) =>
            normalizeString(m.name) === normalizedSearch
          );
          setShowManufacturerField(Boolean(search && !hasExactMatchInResults));
          setShowModelDropdown(filtered.length > 0);
        }
      }
    } catch (e) {
      console.error('Failed to search models', e);
    } finally {
      setIsLoadingModels(false);
    }
  }, [apiUrl, accessToken]);

  const searchManufacturers = useCallback(async (search: string = '') => {
    setIsLoadingManufacturers(true);
    try {
      const res = await fetch(`${apiUrl}/manufacturers?search=${encodeURIComponent(search)}&limit=50`, {
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' },
      });
      const data = await res.json();
      if (data.rows) {
        const filtered = data.rows.filter((m: Manufacturer) =>
          m.name.toLowerCase().includes(search.toLowerCase())
        );
        const exactMatch = filtered.find((m: Manufacturer) => m.name.toLowerCase() === search.toLowerCase());
        if (exactMatch) {
          setSelectedManufacturer(exactMatch);
          setManufacturerSearch(exactMatch.name);
          setShowManufacturerDropdown(false);
        } else {
          setManufacturers(filtered);
          setShowManufacturerDropdown(filtered.length > 0);
        }
      }
    } catch (e) {
      console.error('Failed to search manufacturers', e);
    } finally {
      setIsLoadingManufacturers(false);
    }
  }, [apiUrl, accessToken]);

  const searchCategories = useCallback(async (search: string = '') => {
    setIsLoadingCategories(true);
    try {
      const res = await fetch(`${apiUrl}/categories?search=${encodeURIComponent(search)}&limit=50`, {
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' },
      });
      const data = await res.json();
      if (data.rows) {
        const normalizedSearch = normalizeString(search);
        const filtered = data.rows.filter((c: Category) =>
          normalizeString(c.name).includes(normalizedSearch)
        );
        const exactMatch = filtered.find((c: Category) =>
          normalizeString(c.name) === normalizedSearch
        );
        if (exactMatch) {
          setSelectedCategory(exactMatch);
          setCategorySearch(exactMatch.name);
          setShowCategoryDropdown(false);
        } else {
          setCategories(filtered);
          setShowCategoryDropdown(filtered.length > 0);
        }
      }
    } catch (e) {
      console.error('Failed to search categories', e);
    } finally {
      setIsLoadingCategories(false);
    }
  }, [apiUrl, accessToken]);

  const searchLocations = useCallback(async (search: string = '') => {
    setIsLoadingLocations(true);
    try {
      const res = await fetch(`${apiUrl}/locations?search=${encodeURIComponent(search)}&limit=50`, {
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' },
      });
      const data = await res.json();
      if (data.rows) {
        const filtered = data.rows.filter((l: Location) =>
          l.name.toLowerCase().includes(search.toLowerCase())
        );
        const exactMatch = filtered.find((l: Location) => l.name.toLowerCase() === search.toLowerCase());
        if (exactMatch) {
          setSelectedLocation(exactMatch);
          setLocationSearch(exactMatch.name);
          setShowLocationDropdown(false);
        } else {
          setLocations(filtered);
          setShowLocationDropdown(filtered.length > 0);
        }
      }
    } catch (e) {
      console.error('Failed to search locations', e);
    } finally {
      setIsLoadingLocations(false);
    }
  }, [apiUrl, accessToken]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (companySearch) searchCompanies(companySearch);
    }, 300);
    return () => clearTimeout(timeout);
  }, [companySearch, searchCompanies]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (modelSearch) searchModels(modelSearch);
    }, 300);
    return () => clearTimeout(timeout);
  }, [modelSearch, searchModels]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (manufacturerSearch) searchManufacturers(manufacturerSearch);
    }, 300);
    return () => clearTimeout(timeout);
  }, [manufacturerSearch, searchManufacturers]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (categorySearch) searchCategories(categorySearch);
    }, 300);
    return () => clearTimeout(timeout);
  }, [categorySearch, searchCategories]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (locationSearch) searchLocations(locationSearch);
    }, 300);
    return () => clearTimeout(timeout);
  }, [locationSearch, searchLocations]);

  // Auto-fill asset name as "MANUFACTURER MODEL" until the user edits it manually
  useEffect(() => {
    if (assetNameManuallyEdited) return;
    const manufacturer = (selectedManufacturer?.name || manufacturerSearch || '').trim();
    const model = (selectedModel?.name || modelSearch || '').trim();
    const composed = [manufacturer, model].filter(Boolean).join(' ');
    setAssetName(composed);
  }, [selectedManufacturer, manufacturerSearch, selectedModel, modelSearch, assetNameManuallyEdited]);

  const handleModelInputChange = (value: string) => {
    setModelSearch(value);
    setSelectedModel(null);
    if (value) {
      const exactMatch = models.find(m => m.name.toLowerCase() === value.toLowerCase());
      if (!exactMatch) {
        setShowManufacturerField(true);
      } else {
        setShowManufacturerField(false);
      }
    } else {
      setShowManufacturerField(false);
    }
  };

  const handleModelSelect = (model: Model) => {
    setSelectedModel(model);
    setModelSearch(model.name);
    setShowModelDropdown(false);
    setShowManufacturerField(false);
  };

  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1920;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height *= maxDim / width;
              width = maxDim;
            } else {
              width *= maxDim / height;
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          let quality = 0.85;
          const attempt = () => {
            canvas.toBlob((blob) => {
              if (blob && blob.size > 2 * 1024 * 1024 && quality > 0.3) {
                quality -= 0.1;
                attempt();
              } else if (blob) {
                resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
              } else {
                resolve(file);
              }
            }, 'image/jpeg', quality);
          };
          attempt();
        };
      };
      reader.onerror = () => resolve(file);
    });
  };

  const getOrCreateCompanyByName = async (name: string): Promise<number | null> => {
    if (!name) return null;
    try {
      const searchRes = await fetch(`${apiUrl}/companies?search=${encodeURIComponent(name)}&limit=10`, {
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' },
      });
      const data = await searchRes.json();
      const existing = data.rows?.find((c: any) => c.name.toLowerCase() === name.toLowerCase());
      if (existing) return existing.id;

      const createRes = await fetch(`${apiUrl}/companies`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const createData = await createRes.json();
      return createData.id || createData.payload?.id || createData.data?.id || null;
    } catch (e) {
      console.error('Failed to get/create company:', e);
      return null;
    }
  };

  const getOrCreateManufacturerByName = async (name: string): Promise<number | null> => {
    if (!name) return null;
    try {
      const searchRes = await fetch(`${apiUrl}/manufacturers?search=${encodeURIComponent(name)}&limit=10`, {
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' },
      });
      const data = await searchRes.json();
      const existing = data.rows?.find((m: any) => m.name.toLowerCase() === name.toLowerCase());
      if (existing) return existing.id;

      const createRes = await fetch(`${apiUrl}/manufacturers`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const createData = await createRes.json();
      return createData.id || createData.payload?.id || createData.data?.id || null;
    } catch (e) {
      console.error('Failed to get/create manufacturer:', e);
      return null;
    }
  };

  const getOrCreateCategoryByNameInternal = async (name: string): Promise<number | null> => {
    if (!name) return null;
    try {
      const searchRes = await fetch(`${apiUrl}/categories?search=${encodeURIComponent(name)}&limit=50`, {
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' },
      });
      const data = await searchRes.json();
      const existing = data.rows?.find((c: any) => c.name.toLowerCase() === name.toLowerCase());
      if (existing) return existing.id;

      const createRes = await fetch(`${apiUrl}/categories`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, category_type: 'asset', use_default_eula: '0', require_acceptance: '0', checkin_email: '0' }),
      });
      const createData = await createRes.json();
      return createData.id || createData.payload?.id || createData.data?.id || null;
    } catch (e) {
      console.error('Failed to get/create category:', e);
      return null;
    }
  };

  const getOrCreateModelInternal = async (modelName: string, manufacturerId: number, categoryId?: number | null): Promise<number | null> => {
    if (!modelName) return null;
    try {
      const searchRes = await fetch(`${apiUrl}/models?search=${encodeURIComponent(modelName)}&limit=10`, {
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' },
      });
      const data = await searchRes.json();
      const existing = data.rows?.find((m: any) => m.name.toLowerCase() === modelName.toLowerCase());
      if (existing) return existing.id;

      let resolvedCategoryId = categoryId;
      if (!resolvedCategoryId) {
        const catRes = await fetch(`${apiUrl}/categories?limit=50`, {
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' },
        });
        const catData = await catRes.json();
        const assetCat = catData.rows?.find((c: any) => c.category_type === 'asset' || c.category_type === 'Asset');
        resolvedCategoryId = assetCat?.id || catData.rows?.[0]?.id || null;
      }

      if (!resolvedCategoryId) return null;

      const createRes = await fetch(`${apiUrl}/models`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName, manufacturer_id: manufacturerId, category_id: resolvedCategoryId }),
      });
      const createData = await createRes.json();
      return createData.id || createData.payload?.id || createData.data?.id || createData.model?.id || null;
    } catch (e) {
      console.error('Failed to get/create model:', e);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      let finalCompanyId = selectedCompany?.id;
      if (!finalCompanyId && companySearch) {
        finalCompanyId = (await getOrCreateCompanyByName(companySearch)) || undefined;
      }

      let finalModelId = selectedModel?.id;
      if (!finalModelId && modelSearch) {
        const manufacturerId = selectedManufacturer?.id || (await getOrCreateManufacturerByName(manufacturerSearch));
        if (!manufacturerId) throw new Error('Manufacturer is required to create a new model.');

        let categoryId = selectedCategory?.id;
        if (!categoryId && categorySearch) {
          categoryId = (await getOrCreateCategoryByNameInternal(categorySearch)) || undefined;
        }

        finalModelId = (await getOrCreateModelInternal(modelSearch, manufacturerId, categoryId)) || undefined;
      }

      if (!finalModelId) throw new Error('Model is required.');

      const snipeitFormData = new FormData();
      snipeitFormData.append('asset_tag', assetTag);
      snipeitFormData.append('name', assetName);
      snipeitFormData.append('serial', serial);
      snipeitFormData.append('status_id', selectedStatus?.id?.toString() || '');
      snipeitFormData.append('model_id', finalModelId.toString());
      snipeitFormData.append('notes', notes);
      if (finalCompanyId) snipeitFormData.append('company_id', finalCompanyId.toString());
      if (selectedLocation?.id) snipeitFormData.append('rtd_location_id', selectedLocation.id.toString());
      snipeitFormData.append('requestable', requestable ? '1' : '0');

      if (image) {
        const compressed = await compressImage(image);
        snipeitFormData.append('image', compressed);
      }

      const response = await fetch(`${apiUrl}/hardware`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' },
        body: snipeitFormData,
      });

      const data = await response.json();

      if (!response.ok || data.status === 'error') {
        const errorMsg = data.messages 
          ? Object.entries(data.messages).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('; ')
          : data.message || `API error: ${response.status}`;
        throw new Error(errorMsg);
      }

      setMessage({ type: 'success', text: 'Asset created successfully!' });
      // Reset form
      setAssetTag('');
      setAssetName('');
      setAssetNameManuallyEdited(false);
      setSerial('');
      setNotes('');
      setRequestable(false);
      setImage(null);
      setImagePreview(null);
      setSelectedCompany(null);
      setCompanySearch('');
      setSelectedModel(null);
      setModelSearch('');
      setSelectedManufacturer(null);
      setManufacturerSearch('');
      setSelectedCategory(null);
      setCategorySearch('');
      setSelectedLocation(null);
      setLocationSearch('');
      setShowManufacturerField(false);
      fetchNextAssetTag();
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      setPendingStream(stream);
      setIsCameraActive(true);
      setCapturedImage(null);
    } catch (e) {
      alert('Could not access camera. Please ensure you have granted camera permissions.');
    }
  };

  useEffect(() => {
    if (isCameraActive && pendingStream && videoRef.current) {
      videoRef.current.srcObject = pendingStream;
      setPendingStream(null);
    }
  }, [isCameraActive, pendingStream]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setCapturedImage(null);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'captured-image.jpg', { type: 'image/jpeg' });
            setImage(file);
            const imageUrl = URL.createObjectURL(blob);
            setCapturedImage(imageUrl);
            setImagePreview(imageUrl);
            // Attach file to file input for form submission
            const dt = new DataTransfer();
            dt.items.add(file);
            if (fileInputRef.current) {
              fileInputRef.current.files = dt.files;
            }
            if (streamRef.current) {
              streamRef.current.getTracks().forEach(track => track.stop());
              streamRef.current = null;
            }
          }
        }, 'image/jpeg');
      }
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setImagePreview(null);
    setImage(null);
    startCamera();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const clearImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.files = null;
    }
  };


  return (
    <div className="container py-4">
      <h1 className="mb-4">Add New Asset</h1>
      
      {message && (
        <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} alert-dismissible fade show`} role="alert">
          {message.text}
          <button type="button" className="btn-close" onClick={() => setMessage(null)}></button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-3 dropdown" ref={companyRef}>
          <label className="form-label">Company (Owner)</label>
          <input type="hidden" name="company_id" value={selectedCompany?.id || ''} />
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              aria-expanded={showCompanyDropdown}
              name="company_search"
              value={companySearch}
              onChange={(e) => {
                setCompanySearch(e.target.value);
                setHighlightedCompany(0);
              }}
              onFocus={() => searchCompanies(companySearch)}
              onKeyDown={(e) => {
                if (!showCompanyDropdown && e.key !== 'Tab') {
                  if (e.key === 'ArrowDown' || e.key === 'Enter') {
                    e.preventDefault();
                    searchCompanies(companySearch);
                  }
                  return;
                }
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setHighlightedCompany(i => Math.min(i + 1, companies.length - 1));
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setHighlightedCompany(i => Math.max(i - 1, 0));
                } else if (e.key === 'Enter') {
                  e.preventDefault();
                  if (companies[highlightedCompany]) {
                    setSelectedCompany(companies[highlightedCompany]);
                    setCompanySearch(companies[highlightedCompany].name);
                    setShowCompanyDropdown(false);
                  }
                } else if (e.key === 'Escape') {
                  setShowCompanyDropdown(false);
                }
              }}
              placeholder="Search or enter company name..."
              autoComplete="off"
              required
              disabled={isSubmitting}
            />
            {isLoadingCompanies && <span className="input-group-text"><span className="spinner-border spinner-border-sm"></span></span>}
          </div>
          <ul className={`dropdown-menu w-100 ${showCompanyDropdown ? 'show' : ''}`} style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {companies.length > 0 ? companies.map((company, index) => (
              <li key={company.id}>
                <button
                  type="button"
                  className={`dropdown-item ${index === highlightedCompany ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedCompany(company);
                    setCompanySearch(company.name);
                    setShowCompanyDropdown(false);
                  }}
                  onMouseEnter={() => setHighlightedCompany(index)}
                >
                  {company.name}
                </button>
              </li>
            )) : (
              <li><span className="dropdown-item text-muted">Type to search companies...</span></li>
            )}
          </ul>
        </div>

        <div className="mb-3">
          <label className="form-label">Asset Tag</label>
          <input type="text" className="form-control" name="asset_tag" value={assetTag} readOnly autoComplete="off" />
        </div>

        <div className="mb-3">
          <label className="form-label">Serial Number</label>
          <input
            type="text"
            className="form-control"
            name="serial"
            value={serial}
            onChange={(e) => setSerial(e.target.value)}
            placeholder="Enter serial number..."
            autoComplete="off"
            disabled={isSubmitting}
          />
        </div>

        <div className="mb-3 dropdown" ref={modelRef}>
          <label className="form-label">Model</label>
          <input type="hidden" name="model_id" value={selectedModel?.id || ''} />
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              aria-expanded={showModelDropdown}
              name="model_search"
              value={modelSearch}
              onChange={(e) => {
                handleModelInputChange(e.target.value);
                setHighlightedModel(0);
              }}
              onFocus={() => searchModels(modelSearch)}
              onKeyDown={(e) => {
                if (!showModelDropdown && e.key !== 'Tab') {
                  if (e.key === 'ArrowDown' || e.key === 'Enter') {
                    e.preventDefault();
                    searchModels(modelSearch);
                  }
                  return;
                }
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setHighlightedModel(i => Math.min(i + 1, models.length - 1));
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setHighlightedModel(i => Math.max(i - 1, 0));
                } else if (e.key === 'Enter') {
                  e.preventDefault();
                  if (models[highlightedModel]) {
                    handleModelSelect(models[highlightedModel]);
                  }
                } else if (e.key === 'Escape') {
                  setShowModelDropdown(false);
                }
              }}
              placeholder="Search or enter model name..."
              autoComplete="off"
              required
              disabled={isSubmitting}
            />
            {isLoadingModels && <span className="input-group-text"><span className="spinner-border spinner-border-sm"></span></span>}
          </div>
          <ul className={`dropdown-menu w-100 ${showModelDropdown ? 'show' : ''}`} style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {models.length > 0 ? models.map((model, index) => (
              <li key={model.id}>
                <button
                  type="button"
                  className={`dropdown-item ${index === highlightedModel ? 'active' : ''}`}
                  onClick={() => handleModelSelect(model)}
                  onMouseEnter={() => setHighlightedModel(index)}
                >
                  {model.name} {model.manufacturer && <small className="text-muted">({model.manufacturer.name})</small>}
                </button>
              </li>
            )) : (
              <li><span className="dropdown-item text-muted">Type to search models...</span></li>
            )}
          </ul>
        </div>

        {showManufacturerField && (
          <div className="mb-3 dropdown" ref={manufacturerRef}>
            <label className="form-label">Manufacturer (for new model)</label>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                name="manufacturer_search"
                value={manufacturerSearch}
                onChange={(e) => {
                  setManufacturerSearch(e.target.value);
                  setHighlightedManufacturer(0);
                }}
                onFocus={() => searchManufacturers(manufacturerSearch)}
                onKeyDown={(e) => {
                  if (!showManufacturerDropdown && e.key !== 'Tab') {
                    if (e.key === 'ArrowDown' || e.key === 'Enter') {
                      e.preventDefault();
                      searchManufacturers(manufacturerSearch);
                    }
                    return;
                  }
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setHighlightedManufacturer(i => Math.min(i + 1, manufacturers.length - 1));
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setHighlightedManufacturer(i => Math.max(i - 1, 0));
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (manufacturers[highlightedManufacturer]) {
                      setSelectedManufacturer(manufacturers[highlightedManufacturer]);
                      setManufacturerSearch(manufacturers[highlightedManufacturer].name);
                      setShowManufacturerDropdown(false);
                    }
                  } else if (e.key === 'Escape') {
                    setShowManufacturerDropdown(false);
                  }
                }}
                placeholder="Search or enter manufacturer name..."
                required={showManufacturerField}
                autoComplete="off"
                disabled={isSubmitting}
              />
              {isLoadingManufacturers && <span className="input-group-text"><span className="spinner-border spinner-border-sm"></span></span>}
            </div>
            <ul className={`dropdown-menu w-100 ${showManufacturerDropdown ? 'show' : ''}`} style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {manufacturers.length > 0 ? manufacturers.map((mfr, index) => (
                <li key={mfr.id}>
                  <button
                    type="button"
                    className={`dropdown-item ${index === highlightedManufacturer ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedManufacturer(mfr);
                      setManufacturerSearch(mfr.name);
                      setShowManufacturerDropdown(false);
                    }}
                    onMouseEnter={() => setHighlightedManufacturer(index)}
                  >
                    {mfr.name}
                  </button>
                </li>
              )) : (
                <li><span className="dropdown-item text-muted">Type to search manufacturers...</span></li>
              )}
            </ul>
          </div>
        )}

        {showManufacturerField && (
          <div className="mb-3 dropdown" ref={categoryRef}>
            <label className="form-label">Category (for new model)</label>
            <input type="hidden" name="category_id" value={selectedCategory?.id || ''} />
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                name="category_search"
                value={categorySearch}
                onChange={(e) => {
                  setCategorySearch(e.target.value);
                  setSelectedCategory(null);
                  setHighlightedCategory(0);
                }}
                onFocus={() => searchCategories(categorySearch)}
                onKeyDown={(e) => {
                  if (!showCategoryDropdown && e.key !== 'Tab') {
                    if (e.key === 'ArrowDown' || e.key === 'Enter') {
                      e.preventDefault();
                      searchCategories(categorySearch);
                    }
                    return;
                  }
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setHighlightedCategory(i => Math.min(i + 1, categories.length - 1));
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setHighlightedCategory(i => Math.max(i - 1, 0));
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (categories[highlightedCategory]) {
                      setSelectedCategory(categories[highlightedCategory]);
                      setCategorySearch(categories[highlightedCategory].name);
                      setShowCategoryDropdown(false);
                    }
                  } else if (e.key === 'Escape') {
                    setShowCategoryDropdown(false);
                  }
                }}
                placeholder="Search or enter category name..."
                autoComplete="off"
                disabled={isSubmitting}
              />
              {isLoadingCategories && <span className="input-group-text"><span className="spinner-border spinner-border-sm"></span></span>}
            </div>
            <ul className={`dropdown-menu w-100 ${showCategoryDropdown ? 'show' : ''}`} style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {categories.length > 0 ? categories.map((cat, index) => (
                <li key={cat.id}>
                  <button
                    type="button"
                    className={`dropdown-item ${index === highlightedCategory ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setCategorySearch(cat.name);
                      setShowCategoryDropdown(false);
                    }}
                    onMouseEnter={() => setHighlightedCategory(index)}
                  >
                    {cat.name}
                  </button>
                </li>
              )) : (
                <li><span className="dropdown-item text-muted">Type to search categories...</span></li>
              )}
            </ul>
          </div>
        )}

        <div className="mb-3">
          <label className="form-label">Status</label>
          <select
            className="form-select"
            name="status_id"
            value={selectedStatus?.id || ''}
            onChange={(e) => {
              const status = statuses.find(s => s.id === Number(e.target.value));
              setSelectedStatus(status || null);
            }}
            required
            disabled={isSubmitting}
          >
            {statuses.map((status) => (
              <option key={status.id} value={status.id}>
                {status.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label">Notes</label>
          <textarea
            className="form-control"
            name="notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Enter notes..."
            disabled={isSubmitting}
          />
        </div>

        <div className="mb-3 dropdown" ref={locationRef}>
          <label className="form-label">Default Location</label>
          <div className="input-group">
            <input
              type="hidden"
              name="rtd_location_id"
              value={selectedLocation?.id || ''}
            />
            <input
              type="text"
              className="form-control"
              aria-expanded={showLocationDropdown}
              value={locationSearch}
              onChange={(e) => {
                setLocationSearch(e.target.value);
                setHighlightedLocation(0);
              }}
              onFocus={() => searchLocations(locationSearch)}
              onKeyDown={(e) => {
                if (!showLocationDropdown && e.key !== 'Tab') {
                  if (e.key === 'ArrowDown' || e.key === 'Enter') {
                    e.preventDefault();
                    searchLocations(locationSearch);
                  }
                  return;
                }
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setHighlightedLocation(i => Math.min(i + 1, locations.length - 1));
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setHighlightedLocation(i => Math.max(i - 1, 0));
                } else if (e.key === 'Enter') {
                  e.preventDefault();
                  if (locations[highlightedLocation]) {
                    setSelectedLocation(locations[highlightedLocation]);
                    setLocationSearch(locations[highlightedLocation].name);
                    setShowLocationDropdown(false);
                  }
                } else if (e.key === 'Escape') {
                  setShowLocationDropdown(false);
                }
              }}
              placeholder="Search location..."
              autoComplete="off"
            />
            {isLoadingLocations && <span className="input-group-text"><span className="spinner-border spinner-border-sm"></span></span>}
          </div>
          <ul className={`dropdown-menu w-100 ${showLocationDropdown ? 'show' : ''}`} style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {locations.length > 0 ? locations.map((loc, index) => (
              <li key={loc.id}>
                <button
                  type="button"
                  className={`dropdown-item ${index === highlightedLocation ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedLocation(loc);
                    setLocationSearch(loc.name);
                    setShowLocationDropdown(false);
                  }}
                  onMouseEnter={() => setHighlightedLocation(index)}
                >
                  {loc.name}
                </button>
              </li>
            )) : (
              <li><span className="dropdown-item text-muted">Type to search locations...</span></li>
            )}
          </ul>
        </div>

        <div className="mb-3">
          <label className="form-label">Asset Name</label>
          <input
            type="text"
            className="form-control"
            name="name"
            value={assetName}
            onChange={(e) => {
              setAssetName(e.target.value);
              setAssetNameManuallyEdited(true);
            }}
            placeholder="Enter asset name..."
            autoComplete="off"
            disabled={isSubmitting}
          />
        </div>

        <div className="mb-3 form-check">
          <input
            type="checkbox"
            className="form-check-input"
            name="requestable"
            id="requestable"
            checked={requestable}
            onChange={(e) => setRequestable(e.target.checked)}
            disabled={isSubmitting}
          />
          <label className="form-check-label" htmlFor="requestable">Requestable</label>
        </div>

        <div className="mb-3">
          <label className="form-label">Image</label>
          <div className="d-flex gap-2 mb-2">
            <button type="button" className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
              Choose File
            </button>
            {!isCameraActive && !capturedImage && (
              <button type="button" className="btn btn-info" onClick={startCamera}>
                Start Camera
              </button>
            )}
            {(isCameraActive || capturedImage) && (
              <button type="button" className="btn btn-outline-danger" onClick={stopCamera}>
                Stop Camera
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            name="image"
            className="d-none"
            accept="image/*"
            onChange={handleFileSelect}
          />
          
          <canvas ref={canvasRef} className="d-none" />
          
          {/* Embedded Camera/Image Preview Container */}
          <div className="border border-2 rounded p-3 bg-dark" style={{ minHeight: '320px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            {capturedImage ? (
              <>
                <div className="text-white mb-2"><small>Captured Photo</small></div>
                <img src={capturedImage} alt="Captured" className="img-fluid mb-3" style={{ maxHeight: '280px', borderRadius: '8px' }} />
                <button type="button" className="btn btn-warning" onClick={retakePhoto}>
                  <span className="me-1">↻</span> Retake Photo
                </button>
              </>
            ) : isCameraActive ? (
              <>
                <div className="text-white mb-2"><small>Camera Preview</small></div>
                <div className="mb-3" style={{ width: '100%', maxWidth: '400px', height: '280px', backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                  />
                </div>
                <button type="button" className="btn btn-success btn-lg" onClick={captureImage}>
                  <span className="me-1">📷</span> Take Photo
                </button>
              </>
            ) : imagePreview ? (
              <>
                <div className="text-white mb-2"><small>Selected Image</small></div>
                <img src={imagePreview} alt="Preview" className="img-fluid mb-3" style={{ maxHeight: '280px', borderRadius: '8px' }} />
                <button type="button" className="btn btn-outline-danger" onClick={clearImage}>
                  Remove Image
                </button>
              </>
            ) : (
              <div className="text-white text-center">
                <div className="mb-2">📷</div>
                <div>No image selected</div>
                <div className="mt-2"><small>Click "Start Camera" or "Choose File"</small></div>
              </div>
            )}
          </div>
        </div>

        <button type="submit" className="btn btn-primary">Create Asset</button>
      </form>
    </div>
  );
}
