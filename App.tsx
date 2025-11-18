import React, { useState, useCallback, useEffect, useRef } from 'react';
import { generateImagesFromPrompt, enhancePrompt, editImageFromPrompt } from './services/geminiService';

type AspectRatio = '1:1' | '16:9' | '9:16';
type Quality = 'high' | 'medium' | 'low';

const SearchBar: React.FC<{
  prompt: string;
  setPrompt: (prompt: string) => void;
  onGenerate: () => void;
  onEnhance: () => void;
  loading: boolean;
  isEnhancing: boolean;
  aspectRatio: AspectRatio;
  setAspectRatio: (ratio: AspectRatio) => void;
  quality: Quality;
  setQuality: (quality: Quality) => void;
}> = ({ prompt, setPrompt, onGenerate, onEnhance, loading, isEnhancing, aspectRatio, setAspectRatio, quality, setQuality }) => (
  <div className="w-full max-w-3xl flex flex-col items-center gap-4">
    <div className="relative w-full">
      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="صف مشهدًا فنيًا، كائنًا، أو فكرة..."
        className="w-full p-4 pr-56 text-white bg-gray-800 border-2 border-gray-700 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all duration-300"
        disabled={loading || isEnhancing}
      />
      <div className="absolute top-1/2 right-2 transform -translate-y-1/2 flex items-center space-x-2 space-x-reverse">
        <button
          onClick={onGenerate}
          disabled={loading || isEnhancing}
          className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold rounded-full hover:from-purple-700 hover:to-blue-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'جاري الإنشاء...' : 'إنشاء'}
        </button>
        <button
          onClick={onEnhance}
          disabled={loading || isEnhancing}
          className="px-5 py-2.5 text-sm font-medium text-white bg-gray-700 rounded-full hover:bg-gray-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${isEnhancing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1m-1.636 6.364l-.707-.707M12 21v-1m-6.364-1.636l.707-.707M3 12h1m1.636-6.364l.707.707" /></svg>
          {isEnhancing ? 'جاري التحسين...' : 'تحسين'}
        </button>
      </div>
    </div>
     <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
        <div className="flex items-center gap-2">
            <label htmlFor="quality" className="text-sm font-medium text-gray-300">جودة الصورة:</label>
            <select id="quality" value={quality} onChange={(e) => setQuality(e.target.value as Quality)} className="bg-gray-700 text-white border border-gray-600 rounded-md px-3 py-1.5 text-sm focus:ring-purple-500 focus:border-purple-500" disabled={loading || isEnhancing}>
                <option value="high">عالية</option>
                <option value="medium">متوسطة</option>
                <option value="low">منخفضة</option>
            </select>
        </div>
        <div className="flex items-center gap-2">
            <label htmlFor="aspectRatio" className="text-sm font-medium text-gray-300">نسبة الأبعاد:</label>
            <select id="aspectRatio" value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as AspectRatio)} className="bg-gray-700 text-white border border-gray-600 rounded-md px-3 py-1.5 text-sm focus:ring-purple-500 focus:border-purple-500" disabled={loading || isEnhancing}>
                <option value="1:1">مربع (1:1)</option>
                <option value="16:9">أفقي (16:9)</option>
                <option value="9:16">عمودي (9:16)</option>
            </select>
        </div>
    </div>
  </div>
);

const ImageGrid: React.FC<{
  images: string[];
  editingIndex: number | null;
  setEditingIndex: (index: number | null) => void;
  editPrompt: string;
  setEditPrompt: (prompt: string) => void;
  onEditSubmit: (index: number) => Promise<void>;
  isEditing: boolean;
  onImageClick: (index: number) => void;
  onShare: (imgSrc: string, index: number) => void;
  imageCardRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
}> = ({ images, editingIndex, setEditingIndex, editPrompt, setEditPrompt, onEditSubmit, isEditing, onImageClick, onShare, imageCardRefs }) => {
  if (images.length === 0) {
    return (
      <div className="text-center text-gray-400 mt-12">
        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="mt-2 text-lg">سيتم عرض صورك التي تم إنشاؤها هنا.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full px-4">
      {images.map((imgSrc, index) => {
        const isCurrentlyEditing = editingIndex === index;
        const textareaRef = useRef<HTMLTextAreaElement>(null);

        useEffect(() => {
          if (isCurrentlyEditing && textareaRef.current) {
            textareaRef.current.focus();
          }
        }, [isCurrentlyEditing]);
        
        return (
          <div 
            key={index} 
            ref={el => imageCardRefs.current[index] = el}
            className={`bg-gray-800 rounded-lg overflow-hidden shadow-lg transition-all duration-300 flex flex-col group ${isCurrentlyEditing ? 'ring-4 ring-purple-500 scale-105 shadow-purple-500/50' : 'hover:shadow-purple-500/20'}`}
          >
            <div className="relative">
              <img
                src={imgSrc}
                alt={`Generated art ${index + 1}`}
                className="w-full h-auto object-cover aspect-square cursor-pointer"
                onClick={() => onImageClick(index)}
              />
              {isEditing && isCurrentlyEditing && (
                <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
                  <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                 <button onClick={() => onShare(imgSrc, index)} className="p-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-75 transition-all" title="مشاركة الصورة">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.368a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" /></svg>
                </button>
                <a href={imgSrc} download={`generated-image-${index + 1}.jpeg`} className="p-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-75 transition-all" title="تحميل الصورة">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                </a>
              </div>
            </div>
            <div className="p-4 flex-grow flex flex-col justify-end">
              {!isCurrentlyEditing ? (
                <button
                  onClick={() => { setEditingIndex(index); setEditPrompt(''); }}
                  disabled={isEditing || editingIndex !== null}
                  className="w-full px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  تعديل الصورة
                </button>
              ) : (
                <div className="space-y-3">
                  <textarea
                    ref={textareaRef}
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    placeholder="مثال: 'إضافة قبعة سانتا على القط'"
                    className="w-full p-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none"
                    rows={2}
                    disabled={isEditing}
                    aria-label="وصف تعديل الصورة"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingIndex(null)}
                      disabled={isEditing}
                      className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-600 rounded-md hover:bg-gray-500 transition-colors disabled:opacity-50"
                    >
                      إلغاء
                    </button>
                    <button
                      onClick={() => onEditSubmit(index)}
                      disabled={isEditing || !editPrompt.trim()}
                      className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {isEditing ? 'جاري التعديل...' : 'تطبيق التعديل'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  );
};

const ImageViewer: React.FC<{
  images: string[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}> = ({ images, currentIndex, onClose, onNext, onPrev }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'ArrowLeft') onPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNext, onPrev]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50" onClick={onClose} role="dialog" aria-modal="true">
      <div className="relative max-w-4xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
        <img src={images[currentIndex]} alt={`Vewing image ${currentIndex + 1}`} className="w-full h-full object-contain" />
        <button onClick={onClose} className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 transition-all" aria-label="إغلاق">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        {images.length > 1 && (
          <>
            <button onClick={onPrev} className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 transition-all" aria-label="الصورة السابقة">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button onClick={onNext} className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 transition-all" aria-label="الصورة التالية">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const Loader: React.FC = () => (
  <div className="flex flex-col items-center justify-center text-white space-y-4">
    <svg className="animate-spin h-10 w-10 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <p className="text-lg">جاري إنشاء الصور، قد يستغرق هذا بعض الوقت...</p>
  </div>
);

const App: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // New state for generation options
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [quality, setQuality] = useState<Quality>('high');

  // State for image editing
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editPrompt, setEditPrompt] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const imageCardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // State for image viewer
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  useEffect(() => {
    if (editingIndex !== null && imageCardRefs.current[editingIndex]) {
      imageCardRefs.current[editingIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [editingIndex]);
  
  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const handleEnhance = useCallback(async () => {
    if (!prompt.trim()) {
      setError('الرجاء إدخال وصف أولاً لتحسينه.');
      return;
    }
    setIsEnhancing(true);
    setError(null);
    try {
      const enhanced = await enhancePrompt(prompt);
      setPrompt(enhanced);
    } catch (err) {
      setError('حدث خطأ أثناء تحسين الوصف. يرجى المحاولة مرة أخرى.');
      console.error(err);
    } finally {
      setIsEnhancing(false);
    }
  }, [prompt]);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      setError('الرجاء إدخال وصف لإنشاء صورة.');
      return;
    }

    setLoading(true);
    setError(null);
    setImages([]);
    setEditingIndex(null); // Close any open edit boxes

    try {
      const generatedImages = await generateImagesFromPrompt(prompt, aspectRatio, quality);
      setImages(generatedImages);
      imageCardRefs.current = imageCardRefs.current.slice(0, generatedImages.length);
    } catch (err) {
      setError('حدث خطأ أثناء إنشاء الصور. يرجى المحاولة مرة أخرى.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [prompt, aspectRatio, quality]);

  const handleEditImage = useCallback(async (indexToEdit: number) => {
    if (!editPrompt.trim()) {
      setError('الرجاء إدخال وصف للتعديل.');
      return;
    }

    setIsEditing(true);
    setError(null);
    const originalImageSrc = images[indexToEdit];

    try {
      const editedImageSrc = await editImageFromPrompt(originalImageSrc, editPrompt);
      const newImages = [...images];
      newImages[indexToEdit] = editedImageSrc;
      setImages(newImages);
      setEditingIndex(null);
      setEditPrompt('');
    } catch (err) {
      setError('حدث خطأ أثناء تعديل الصورة. يرجى المحاولة مرة أخرى.');
      console.error(err);
    } finally {
      setIsEditing(false);
    }
  }, [editPrompt, images]);

  const dataURLtoFile = (dataurl: string, filename: string): File | null => {
      const arr = dataurl.split(',');
      if (arr.length < 2) return null;
      const match = arr[0].match(/:(.*?);/);
      if (!match) return null;
      const mime = match[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
      }
      return new File([u8arr], filename, { type: mime });
  }

  const handleShare = async (imgSrc: string, index: number) => {
    const fileName = `generated-image-${index + 1}.jpeg`;
    const imageFile = dataURLtoFile(imgSrc, fileName);

    if (!imageFile) {
      setError('تعذر معالجة الصورة للمشاركة.');
      return;
    }

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [imageFile] })) {
      try {
        await navigator.share({
          title: 'صورة تم إنشاؤها بواسطة الذكاء الاصطناعي',
          text: 'اكتشف هذه الصورة التي تم إنشاؤها باستخدام Gemini AI!',
          files: [imageFile],
        });
      } catch (error) {
        if ((error as DOMException).name !== 'AbortError') {
           console.error('Error sharing:', error);
           setError('حدث خطأ أثناء محاولة المشاركة.');
        }
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        const blob = await (await fetch(imgSrc)).blob();
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob, }),
        ]);
        showNotification('تم نسخ الصورة إلى الحافظة!');
      } catch (err) {
        console.error('Failed to copy image to clipboard:', err);
        setError('المشاركة غير مدعومة في هذا المتصفح، وفشل النسخ إلى الحافظة.');
      }
    }
  };
  
  const handleOpenViewer = (index: number) => setSelectedImageIndex(index);
  const handleCloseViewer = () => setSelectedImageIndex(null);
  const handleNextImage = () => {
    if (selectedImageIndex !== null) {
      setSelectedImageIndex((selectedImageIndex + 1) % images.length);
    }
  };
  const handlePrevImage = () => {
     if (selectedImageIndex !== null) {
      setSelectedImageIndex((selectedImageIndex - 1 + images.length) % images.length);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 sm:p-6 lg:p-8" dir="rtl">
      <header className="text-center my-8 sm:my-12">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-400">
            استوديو الصور بالذكاء الاصطناعي
          </span>
        </h1>
        <p className="text-gray-400 mt-4 text-lg max-w-2xl mx-auto">
          أنشئ، عدّل، وشارك فنًا بصريًا مذهلاً. حوّل كلماتك إلى صور فريدة، ثم قم بتعديلها ومشاركتها مع العالم.
        </p>
      </header>

      <main className="flex flex-col items-center w-full flex-grow">
        <div className="w-full max-w-3xl mb-8">
            <SearchBar 
              prompt={prompt} 
              setPrompt={setPrompt} 
              onGenerate={handleGenerate} 
              onEnhance={handleEnhance}
              loading={loading}
              isEnhancing={isEnhancing}
              aspectRatio={aspectRatio}
              setAspectRatio={setAspectRatio}
              quality={quality}
              setQuality={setQuality}
            />
            {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
        </div>

        <div className="w-full max-w-7xl flex-grow flex items-center justify-center">
          {loading ? <Loader /> : 
            <ImageGrid 
              images={images} 
              editingIndex={editingIndex}
              setEditingIndex={setEditingIndex}
              editPrompt={editPrompt}
              setEditPrompt={setEditPrompt}
              onEditSubmit={handleEditImage}
              isEditing={isEditing}
              onImageClick={handleOpenViewer}
              onShare={handleShare}
              imageCardRefs={imageCardRefs}
            />
          }
        </div>
      </main>

       {selectedImageIndex !== null && (
        <ImageViewer
          images={images}
          currentIndex={selectedImageIndex}
          onClose={handleCloseViewer}
          onNext={handleNextImage}
          onPrev={handlePrevImage}
        />
      )}

      {notification && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-full shadow-lg transition-all duration-300 animate-bounce">
          {notification}
        </div>
      )}

      <footer className="text-center py-6 text-gray-500 text-sm">
        <p>مدعوم بواسطة واجهة برمجة تطبيقات Gemini من Google</p>
      </footer>
    </div>
  );
};

export default App;