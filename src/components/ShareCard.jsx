/**
 * 分享卡片组件
 * 使用html2canvas将DOM转成图片
 */
import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { X, Download, Share2, Image as ImageIcon } from 'lucide-react';

export function ShareCard({ 
  visible, 
  onClose, 
  cardRef,
  title = '宝贝时光',
  content = '',
  subContent = '',
  qrCodeData = null
}) {
  const [generating, setGenerating] = useState(false);
  const [shareImage, setShareImage] = useState(null);

  // 生成分享图片
  const generateShareImage = async () => {
    if (!cardRef?.current) return;
    
    setGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        scale: 2, // 提高清晰度
        logging: false
      });
      
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      setShareImage(dataUrl);
    } catch (error) {
      console.error('生成分享图片失败:', error);
    } finally {
      setGenerating(false);
    }
  };

  // 关闭时重置状态
  const handleClose = () => {
    setShareImage(null);
    onClose();
  };

  // 下载图片
  const downloadImage = () => {
    if (!shareImage) return;
    
    const link = document.createElement('a');
    link.download = `宝贝时光分享_${Date.now()}.png`;
    link.href = shareImage;
    link.click();
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl animate-scale-in">
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-primary-500" />
            生成分享图片
          </h3>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 内容区 */}
        <div className="p-4">
          {!shareImage ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                点击下方按钮，将卡片生成为图片
              </p>
              <button
                onClick={generateShareImage}
                disabled={generating}
                className="w-full py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-bold hover:from-primary-600 hover:to-primary-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    生成中...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-5 h-5" />
                    生成分享图片
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700">
                <img 
                  src={shareImage} 
                  alt="分享图片预览" 
                  className="w-full h-auto"
                />
              </div>
              <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                长按图片保存，或点击下方按钮下载
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShareImage(null)}
                  className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  重新生成
                </button>
                <button
                  onClick={downloadImage}
                  className="flex-1 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-bold hover:from-primary-600 hover:to-primary-700 transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  下载图片
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ShareCard;
