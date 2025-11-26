
import React, { useState, useEffect } from 'react';
import { AppStep, UserState } from './types';
import { TEST_MODE, TARGET_DATE, getImg, CARDS_CONFIG, FINAL_ANSWER } from './constants';

/**
 * 輪播區塊配置 (在此調整位置與大小)
 */
const CAROUSEL_LAYOUT = {
  // 容器定位 (相對於正方形背景)
  bottom: '10%', 
  left: '10%',
  width: '80%',
  height: '25%',

  // 輪播設定
  visibleCount: 4,  // 一次顯示幾張
  cardGap: '0%',    // 卡片間距
  arrowSize: '15%',  // 左右箭頭大小
  
  // 卡片寬度調整 (若需要個別調整卡片大小可改這裡)
  // 計算方式會自動處理，這裡主要影響初始比例
  cardAspectRatio: '2/3' 
};

/**
 * SHA-256 雜湊函式
 * 用於將使用者輸入的明文轉換為亂碼指紋
 */
const hashString = async (text: string): Promise<string> => {
  // 將文字轉為 Uint8Array
  const msgBuffer = new TextEncoder().encode(text);
  // 使用 Web Crypto API 進行 SHA-256 雜湊
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  // 將 ArrayBuffer 轉回 16 進制字串
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * RWD 終極解決方案：100vmin 正方形容器
 */
const SquarePage: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-black overflow-hidden">
      <div className="relative w-[100vmin] h-[100vmin] bg-black shadow-2xl overflow-hidden text-black">
        {children}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  // --- 狀態 ---
  const [step, setStep] = useState<AppStep>(AppStep.HOME);
  const [user, setUser] = useState<UserState>({ name: '', solvedCards: [], finalSolved: false });
  
  // 轉場狀態 (控制 Name -> Carousel 的淡出)
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // 輪播狀態
  const [carouselIndex, setCarouselIndex] = useState(0);

  // 卡片互動狀態
  const [activeCardId, setActiveCardId] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false); // 控制是否展開滿版
  const [isFlipped, setIsFlipped] = useState(false);   // 控制是否翻轉到背面
  const [isAnimating, setIsAnimating] = useState(false);

  // 輸入狀態
  const [inputName, setInputName] = useState('');
  const [inputCardAnswer, setInputCardAnswer] = useState('');
  const [inputFinalAnswer, setInputFinalAnswer] = useState('');

  // 錯誤震動狀態
  const [shakeError, setShakeError] = useState(false);

  // 倒數計時
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isGameLive, setIsGameLive] = useState(false);

  // 預載圖片
  useEffect(() => {
    const images = [
      'home.png', 'start.png', 'name.png', 'carousel.png',
      ...CARDS_CONFIG.map(c => `card_${c.id}_front.png`),
      ...CARDS_CONFIG.map(c => `card_${c.id}_back.png`),
      'light_1.png', 'light_2.png', 'light_3.png', 'end.png'
    ];
    images.forEach(src => { const img = new Image(); img.src = getImg(src); });
  }, []);

  // 倒數邏輯
  useEffect(() => {
    if (TEST_MODE) { setIsGameLive(true); return; }
    const interval = setInterval(() => {
      const diff = new Date(TARGET_DATE).getTime() - Date.now();
      if (diff < 0) {
        setIsGameLive(true);
        setTimeLeft("00:00:00");
        clearInterval(interval);
      } else {
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const m = Math.floor((diff / 1000 / 60) % 60);
        const s = Math.floor((diff / 1000) % 60);
        setTimeLeft(`${d}天 ${h}時 ${m}分 ${s}秒`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // --- 互動函式 ---

  const handleError = () => {
    setShakeError(true);
    setTimeout(() => setShakeError(false), 500); // 震動 0.5 秒
  };

  const handleNameSubmit = () => {
    if (!inputName.trim()) return;
    setUser(prev => ({ ...prev, name: inputName }));
    
    // 觸發淡出動畫
    setIsTransitioning(true);
    
    // 1秒後切換頁面
    setTimeout(() => {
      setStep(AppStep.CAROUSEL);
      setIsTransitioning(false);
    }, 1000);
  };

  // 輪播控制
  const handlePrev = () => {
    if (carouselIndex > 0) {
      setCarouselIndex(prev => prev - 3);
    }
  };

  const handleNext = () => {
    if (carouselIndex + CAROUSEL_LAYOUT.visibleCount < CARDS_CONFIG.length) {
      setCarouselIndex(prev => prev + 3);
    }
  };

  // 打開卡片：先放大 (Expand)，再翻轉 (Flip)
  const openCard = (id: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setActiveCardId(id);
    setInputCardAnswer('');
    
    requestAnimationFrame(() => {
      // 1. 放大移動到位
      setIsExpanded(true); 
      
      // 2. 等待放大動畫結束後，翻轉
      setTimeout(() => {
        setIsFlipped(true); 
        // 3. 解鎖
        setTimeout(() => {
            setIsAnimating(false);
        }, 600);
      }, 600);
    });
  };

  // 關閉卡片：先翻回正面，再縮小回原位
  const closeCard = (solved: boolean) => {
    if (isAnimating) return;
    setIsAnimating(true);

    // 1. 翻回正面
    setIsFlipped(false); 

    // 2. 等待翻轉結束，縮小
    setTimeout(() => {
        setIsExpanded(false);
        
        // 3. 等待縮小結束，重置
        setTimeout(() => {
            setActiveCardId(null);
            setIsAnimating(false);
            if (solved && activeCardId) {
                const newSolved = [...user.solvedCards, activeCardId];
                setUser(prev => ({ ...prev, solvedCards: newSolved }));
                
                // 檢查是否全破
                if (newSolved.length === CARDS_CONFIG.length) {
                  setTimeout(() => setStep(AppStep.LIGHT_1), 800);
                }
            }
        }, 600);
    }, 600);
  };

  // 驗證卡片答案 (雜湊比對)
  const submitCardAnswer = async () => {
    const card = CARDS_CONFIG.find(c => c.id === activeCardId);
    if (!card) return;

    // 將輸入文字去除空白並轉小寫，然後計算 SHA-256
    const cleanInput = inputCardAnswer.trim().toLowerCase();
    const hashedInput = await hashString(cleanInput);

    if (hashedInput === card.answer) {
      closeCard(true);
    } else {
      handleError();
    }
  };

  // 驗證最終答案 (雜湊比對)
  const submitFinalAnswer = async () => {
    const cleanInput = inputFinalAnswer.trim().toLowerCase();
    const hashedInput = await hashString(cleanInput);

    if (hashedInput === FINAL_ANSWER) {
      setStep(AppStep.END);
    } else {
      handleError();
    }
  };

  // Light 過場自動切換 (時間為 2500ms)
  useEffect(() => {
    if (step === AppStep.LIGHT_1) setTimeout(() => setStep(AppStep.LIGHT_2), 2500); 
    if (step === AppStep.LIGHT_2) setTimeout(() => setStep(AppStep.LIGHT_3), 2500);
  }, [step]);

  // 計算目前顯示的卡片
  const visibleCards = CARDS_CONFIG.slice(carouselIndex, carouselIndex + CAROUSEL_LAYOUT.visibleCount);
  
  // 計算單張卡片寬度 (扣除間距後平分)
  const cardWidthPct = (100 - (Number(CAROUSEL_LAYOUT.cardGap.replace('%','')) * (CAROUSEL_LAYOUT.visibleCount - 1))) / CAROUSEL_LAYOUT.visibleCount;

  // 判斷是否需要渲染遊戲層 (Carousel/Cards/Lights)
  // 當 step 是 NAME 時也渲染，作為背景預載，但需鎖定互動
  const shouldRenderGameLayer = [AppStep.NAME, AppStep.CAROUSEL, AppStep.LIGHT_1, AppStep.LIGHT_2, AppStep.LIGHT_3].includes(step);
  const isGameLayerInteractive = step !== AppStep.NAME;

  return (
    <SquarePage>
      {/* 全域背景色 (避免圖片透明部分透出底色) */}
      <div className="absolute inset-0 bg-black" />

      {/* --- HOME --- */}
      {step === AppStep.HOME && (
        <div className="absolute inset-0 w-full h-full z-10">
          <img src={getImg('home.png')} className="w-full h-full object-contain" alt="Home" />
          {!isGameLive ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-20">
              <div className="text-white text-[5vmin] tracking-widest mb-4">GAME START IN</div>
              <div className="text-lumina-primary text-[6vmin] font-mono animate-pulse">{timeLeft}</div>
            </div>
          ) : (
            <button onClick={() => setStep(AppStep.START)} className="absolute inset-0 z-10 w-full h-full cursor-pointer" />
          )}
        </div>
      )}

      {/* --- START --- */}
      {step === AppStep.START && (
        <div className="absolute inset-0 w-full h-full z-10">
          <img src={getImg('start.png')} className="w-full h-full object-contain" alt="Start" />
          <button 
            onClick={() => setStep(AppStep.NAME)}
            className="absolute cursor-pointer bg-transparent"
            style={{ top: '45%', left: '35%', width: '30%', height: '10%' }}
          />
        </div>
      )}

      {/* --- NAME --- */}
      {/* 獨立渲染 NAME 層級，並給予較高的 z-index */}
      {step === AppStep.NAME && (
        <div className={`absolute inset-0 w-full h-full z-[100] transition-opacity duration-1000 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
          <img src={getImg('name.png')} className="w-full h-full object-contain" alt="Name" />
          <input 
            type="text" value={inputName} onChange={e => setInputName(e.target.value)}
            placeholder="請輸入暱稱"
            className="absolute bg-white/90 text-black text-center text-[4vmin] rounded shadow-lg outline-none focus:ring-2 ring-red-500 font-bold"
            style={{ top: '45%', left: '30%', width: '40%', height: '8%' }}
          />
          <button 
            onClick={handleNameSubmit}
            className="absolute cursor-pointer bg-transparent"
            style={{ top: '61%', left: '43.5%', width: '13%', height: '8%' }}
          />
        </div>
      )}

      {/* --- GAME LAYER (CAROUSEL & GAMEPLAY) --- */}
      {/* 當 step 是 NAME 時，此層級在底部作為背景 */}
      {shouldRenderGameLayer && (
        <div className={`absolute inset-0 w-full h-full overflow-hidden perspective-1000 z-0 ${isGameLayerInteractive ? 'pointer-events-auto' : 'pointer-events-none'}`}>
          {/* 背景 */}
          <img src={getImg('carousel.png')} className="absolute inset-0 w-full h-full object-contain" alt="Bg" />

          {/* 
            小卡輪播容器 
          */}
          <div 
            className="absolute flex items-end z-10"
            style={{ 
                bottom: CAROUSEL_LAYOUT.bottom, 
                left: CAROUSEL_LAYOUT.left, 
                width: CAROUSEL_LAYOUT.width, 
                height: CAROUSEL_LAYOUT.height 
            }}
          >
            {/* 左箭頭 */}
            <button 
                onClick={handlePrev}
                disabled={carouselIndex === 0}
                className={`absolute -left-[10%] top-1/2 -translate-y-1/2 text-white font-bold flex items-center justify-center transition-opacity ${carouselIndex === 0 ? 'opacity-30' : 'opacity-100'}`}
                style={{ width: CAROUSEL_LAYOUT.arrowSize, height: CAROUSEL_LAYOUT.arrowSize, fontSize: '4vmin' }}
            >
                ⇦
            </button>

            {/* 卡片列表 */}
            <div className="w-full h-full flex justify-between items-end">
                {visibleCards.map((card) => {
                    const isSolved = user.solvedCards.includes(card.id);
                    const isActive = activeCardId === card.id;
                    return (
                        <div 
                            key={card.id} 
                            className="relative transition-transform hover:scale-105 h-full"
                            style={{ 
                                width: `${cardWidthPct}%`
                            }}
                        >
                        <div 
                            onClick={() => isGameLayerInteractive && !isActive && !isSolved && openCard(card.id)}
                            className={`w-full h-full relative cursor-pointer ${isActive ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
                        >
                            <img src={getImg(`card_${card.id}_front.png`)} className="w-full h-full object-contain" />
                            {isSolved && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                <div className="border-2 border-red-500 text-red-500 font-bold text-[3vmin] p-1 rotate-[-15deg] bg-black/80">
                                咒語<br/>生效
                                </div>
                            </div>
                            )}
                        </div>
                        </div>
                    );
                })}
            </div>

            {/* 右箭頭 */}
            <button 
                onClick={handleNext}
                disabled={carouselIndex + CAROUSEL_LAYOUT.visibleCount >= CARDS_CONFIG.length}
                className={`absolute -right-[10%] top-1/2 -translate-y-1/2 text-white font-bold flex items-center justify-center transition-opacity ${carouselIndex + CAROUSEL_LAYOUT.visibleCount >= CARDS_CONFIG.length ? 'opacity-30' : 'opacity-100'}`}
                style={{ width: CAROUSEL_LAYOUT.arrowSize, height: CAROUSEL_LAYOUT.arrowSize, fontSize: '4vmin' }}
            >
                ⇨
            </button>
          </div>

          {/* 
            主卡片翻轉層 (Overlay) 
          */}
          {activeCardId !== null && (
            <div 
              className={`absolute inset-0 z-50 transition-all duration-700 ease-in-out preserve-3d`}
              style={{
                transform: `
                  translateY(${isExpanded ? '0' : '50%'}) 
                  scale(${isExpanded ? '1' : '0.2'}) 
                  rotateY(${isFlipped ? '180deg' : '0deg'})
                `,
                opacity: isExpanded ? 1 : 0.8
              }}
            >
              {/* 正面 (Front Face) */}
              <div className="absolute inset-0 w-full h-full backface-hidden" style={{ zIndex: 2 }}>
                 <img src={getImg(`card_${activeCardId}_front.png`)} className="w-full h-full object-contain" />
              </div>

              {/* 背面 (Back Face) */}
              <div 
                className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-black"
                style={{ zIndex: 1 }}
              >
                 <img src={getImg(`card_${activeCardId}_back.png`)} className="w-full h-full object-contain" />
                 
                 {/* 背面互動層 */}
                 <div className="absolute inset-0">
                    <input 
                      type="text" value={inputCardAnswer} onChange={e => setInputCardAnswer(e.target.value)}
                      placeholder="輸入咒語"
                      className={`absolute bg-white/90 text-black text-center text-[3vmin] rounded outline-none font-bold ${shakeError ? 'animate-shake-center border-2 border-red-600' : ''}`}
                      style={{ top: '48%', left: '50%', transform: 'translateX(-50%)', width: '50%', height: '7%' }}
                    />
                    {shakeError && (
                      <div className="absolute text-red-500 font-bold text-[3vmin] animate-shake-center" style={{ top: '70%', left: '50%', transform: 'translateX(-50%)' }}>
                        咒語無效
                      </div>
                    )}

                    {/* 確認按鈕 */}
                    <button onClick={submitCardAnswer}
                      className="absolute cursor-pointer bg-transparent"
                      style={{ top: '77%', right: '25%', width: '22.5%', height: '7%' }}
                    />
                    {/* 返回按鈕 */}
                    <button onClick={() => closeCard(false)}
                      className="absolute cursor-pointer bg-transparent"
                      style={{ top: '77%', left: '25%', width: '25.5%', height: '7%' }}
                    />
                 </div>
              </div>
            </div>
          )}

          {/* Light 過場 (1 -> 2 -> 3) */}
          <div className={`absolute inset-0 z-40 transition-opacity duration-1000 pointer-events-none ${step === AppStep.LIGHT_1 ? 'opacity-100' : 'opacity-0'}`}>
            <img src={getImg('light_1.png')} className="w-full h-full object-contain" />
          </div>
          <div className={`absolute inset-0 z-40 transition-opacity duration-1000 pointer-events-none ${step === AppStep.LIGHT_2 ? 'opacity-100' : 'opacity-0'}`}>
            <img src={getImg('light_2.png')} className="w-full h-full object-contain" />
          </div>
          
          {/* Light 3 (最終題) */}
          <div className={`absolute inset-0 z-50 transition-opacity duration-1000 ${step === AppStep.LIGHT_3 ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
            <img src={getImg('light_3.png')} className="w-full h-full object-contain bg-black" />
            {step === AppStep.LIGHT_3 && (
              <>
                <input 
                   type="text" value={inputFinalAnswer} onChange={e => setInputFinalAnswer(e.target.value)}
                   placeholder="請輸入阿拉伯數字"
                   className={`absolute bg-white/90 text-black text-center text-[4vmin] rounded outline-none font-bold ${shakeError ? 'animate-shake-center border-red-500 border-2' : ''}`}
                   style={{ top: '65%', left: '50%', transform: 'translateX(-50%)', width: '44%', height: '6%' }}
                />
                {shakeError && (
                  <div className="absolute text-red-500 font-bold text-[3vmin] animate-shake-center" style={{ top: '70%', left: '50%', transform: 'translateX(-50%)' }}>
                    咒語無效
                  </div>
                )}
                <button 
                   onClick={submitFinalAnswer}
                   className="absolute cursor-pointer bg-transparent"
                   style={{ top: '75%', left: '50%', transform: 'translateX(-50%)', width: '23%', height: '7%' }}
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* --- END --- */}
      {step === AppStep.END && (
        <div className="absolute inset-0 w-full h-full z-10">
          <img src={getImg('end.png')} className="w-full h-full object-contain" alt="End" />
          {/* 顯示玩家名字 - #774d00 字體 */}
          <div 
             className="absolute text-center text-[#774d00] font-bold text-[5vmin] drop-shadow-md"
             style={{ top: '40%', left: '50%', transform: 'translateX(-50%)', width: '40%', height: '8%' }}
          >
             {user.name}
          </div>
        </div>
      )}

    </SquarePage>
  );
};

export default App;
