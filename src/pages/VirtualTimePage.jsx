/**
 * 虚拟时光页面 - AI生成内容专题展示
 * 支持点击内容项全屏展示
 */

import { useState, useCallback } from 'react';
import { Sparkles, ArrowLeft, X, Expand, Heart, MessageCircle, Share2, Copy, Check } from 'lucide-react';
import { virtualTimeTopics } from '../data/virtualTimeData';
import { useApp } from '../store/AppContext';

export function VirtualTimePage() {
  const { currentBaby, showToast } = useApp();
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [fullscreenItem, setFullscreenItem] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleTopicClick = (topic) => {
    setSelectedTopic(topic);
  };

  const handleBack = () => {
    setSelectedTopic(null);
    setFullscreenItem(null);
  };

  // 打开全屏查看
  const openFullscreen = useCallback((item) => {
    setFullscreenItem(item);
  }, []);

  // 关闭全屏
  const closeFullscreen = useCallback(() => {
    setFullscreenItem(null);
  }, []);

  // 复制内容到剪贴板
  const copyToClipboard = useCallback((text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      showToast('已复制到剪贴板', 'success');
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      showToast('复制失败', 'error');
    });
  }, [showToast]);

  // 渲染内容卡片
  const renderContentCard = (item, topic) => {
    if (item.type === 'image') {
      return (
        <div 
          key={item.id}
          onClick={() => openFullscreen(item)}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]"
        >
          <div className="flex items-start gap-3">
            <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${topic.coverGradient} flex items-center justify-center flex-shrink-0`}>
              <span className="text-2xl">{topic.coverEmoji}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-gray-800 dark:text-white">{item.title}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{item.description}</p>
              <div className="flex items-center gap-2 mt-2">
                {item.tags?.map((tag, idx) => (
                  <span key={idx} className="text-xs px-2 py-0.5 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full">
                    {tag}
                  </span>
                ))}
                <span className="ml-auto text-xs text-gray-400 flex items-center gap-1">
                  <Expand className="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    if (item.type === 'text') {
      return (
        <div 
          key={item.id}
          onClick={() => openFullscreen(item)}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center flex-shrink-0">
              <span className="text-xl">{item.emoji || '📝'}</span>
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-800 dark:text-white">{item.title}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{item.content}</p>
              <div className="flex items-center gap-2 mt-2">
                {item.tags?.map((tag, idx) => (
                  <span key={idx} className="text-xs px-2 py-0.5 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    if (item.type === 'moment') {
      return (
        <div 
          key={item.id}
          onClick={() => openFullscreen(item)}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-teal-400 flex items-center justify-center flex-shrink-0">
              <span className="text-xl">{item.authorAvatar}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-gray-800 dark:text-white">{item.authorName}</span>
                <span className="text-xs text-gray-400">{item.time}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">{item.title}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{item.content}</p>
              <div className="flex items-center gap-4 mt-2 text-gray-400 text-sm">
                <span className="flex items-center gap-1"><Heart className="w-4 h-4" /> {item.likes}</span>
                <span className="flex items-center gap-1"><MessageCircle className="w-4 h-4" /> {item.comments}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    if (item.type === 'poem') {
      return (
        <div 
          key={item.id}
          onClick={() => openFullscreen(item)}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]"
        >
          <div className="flex items-start gap-3">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">📜</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-bold text-gray-800 dark:text-white">{item.title}</h4>
                <span className="text-xs px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full">
                  {item.difficulty}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">— {item.author}</p>
              <p className="text-primary-600 dark:text-primary-400 font-medium text-sm whitespace-pre-line line-clamp-3">
                {item.content}
              </p>
              <div className="flex items-center gap-2 mt-2">
                {item.tags?.map((tag, idx) => (
                  <span key={idx} className="text-xs px-2 py-0.5 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    return null;
  };

  // 全屏展示内容
  const renderFullscreenContent = (item, topic) => {
    if (!item) return null;
    
    if (item.type === 'image') {
      return (
        <div className="flex flex-col h-full">
          <div className={`flex-1 bg-gradient-to-br ${topic.coverGradient} flex items-center justify-center relative`}>
            <div className="text-center p-8">
              <span className="text-8xl block mb-4 animate-bounce" style={{ animationDuration: '2s' }}>
                {topic.coverEmoji}
              </span>
              <h2 className="text-white text-2xl font-bold drop-shadow-lg">{item.title}</h2>
            </div>
            <div className="absolute top-4 left-4 text-4xl opacity-50">{topic.coverIcon}</div>
            <div className="absolute bottom-4 right-4 text-3xl opacity-50">{topic.coverIcon}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6">
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{item.description}</p>
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              {item.tags?.map((tag, idx) => (
                <span key={idx} className="text-xs px-3 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <button className="flex items-center gap-2 text-gray-500 hover:text-primary-500">
                <Heart className="w-5 h-5" />
                <span className="text-sm">收藏</span>
              </button>
              <button 
                onClick={() => copyToClipboard(item.description)}
                className="flex items-center gap-2 text-gray-500 hover:text-primary-500"
              >
                {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                <span className="text-sm">{copied ? '已复制' : '复制'}</span>
              </button>
              <button className="flex items-center gap-2 text-gray-500 hover:text-primary-500 ml-auto">
                <Share2 className="w-5 h-5" />
                <span className="text-sm">分享</span>
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    if (item.type === 'text') {
      return (
        <div className="flex flex-col h-full bg-gradient-to-b from-amber-50 to-white dark:from-gray-800 dark:to-gray-900">
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center mb-6 shadow-lg">
              <span className="text-4xl">{item.emoji || '📝'}</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 text-center">{item.title}</h2>
            <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed text-center max-w-md">
              {item.content}
            </p>
            <div className="flex items-center gap-2 mt-6 flex-wrap justify-center">
              {item.tags?.map((tag, idx) => (
                <span key={idx} className="text-xs px-3 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 border-t border-gray-100 dark:border-gray-700">
            <button 
              onClick={() => copyToClipboard(item.content)}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary-50 dark:bg-primary-900/30 text-primary-500 rounded-xl"
            >
              {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
              {copied ? '已复制' : '复制内容'}
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl">
              <Share2 className="w-5 h-5" />
              分享
            </button>
          </div>
        </div>
      );
    }
    
    if (item.type === 'poem') {
      return (
        <div className="flex flex-col h-full bg-gradient-to-b from-amber-50 to-white dark:from-gray-800 dark:to-gray-900">
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="mb-6">
              <span className="text-6xl">📜</span>
            </div>
            <span className="text-xs px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full mb-4">
              {item.difficulty}
            </span>
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2 text-center">{item.title}</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">— {item.author}</p>
            <div className="bg-cream-50 dark:bg-gray-800 rounded-2xl p-6 shadow-inner max-w-md">
              <p className="text-xl text-primary-600 dark:text-primary-400 leading-loose text-center font-serif">
                {item.content}
              </p>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-6 text-center max-w-md italic">
              {item.translation}
            </p>
            <div className="flex items-center gap-2 mt-4 flex-wrap justify-center">
              {item.tags?.map((tag, idx) => (
                <span key={idx} className="text-xs px-3 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 border-t border-gray-100 dark:border-gray-700">
            <button 
              onClick={() => copyToClipboard(`${item.title}\n${item.content}\n\n— ${item.author}`)}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary-50 dark:bg-primary-900/30 text-primary-500 rounded-xl"
            >
              {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
              {copied ? '已复制' : '复制诗词'}
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl">
              <Share2 className="w-5 h-5" />
              分享
            </button>
          </div>
        </div>
      );
    }
    
    if (item.type === 'moment') {
      return (
        <div className="flex flex-col h-full bg-gradient-to-b from-green-50 to-white dark:from-gray-800 dark:to-gray-900">
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-teal-400 flex items-center justify-center mb-4 shadow-lg">
              <span className="text-3xl">{item.authorAvatar}</span>
            </div>
            <span className="text-sm text-gray-400 mb-2">{item.time}</span>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2 text-center">{item.authorName}</h3>
            <h4 className="text-lg text-gray-600 dark:text-gray-300 mb-4">{item.title}</h4>
            <p className="text-gray-600 dark:text-gray-300 text-center max-w-md leading-relaxed">
              {item.content}
            </p>
            <div className="flex items-center gap-6 mt-6 text-gray-400">
              <span className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-400" /> {item.likes}
              </span>
              <span className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" /> {item.comments}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 border-t border-gray-100 dark:border-gray-700">
            <button 
              onClick={() => copyToClipboard(item.content)}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary-50 dark:bg-primary-900/30 text-primary-500 rounded-xl"
            >
              {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
              {copied ? '已复制' : '复制'}
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl">
              <Share2 className="w-5 h-5" />
              分享
            </button>
          </div>
        </div>
      );
    }
    
    return null;
  };

  // 专题卡片组件
  const TopicCard = ({ topic }) => (
    <div
      onClick={() => handleTopicClick(topic)}
      className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer active:scale-[0.98] group"
    >
      <div className={`h-36 bg-gradient-to-br ${topic.coverGradient} relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-4 left-4 text-4xl animate-bounce" style={{ animationDuration: '2s' }}>{topic.coverEmoji}</div>
          <div className="absolute bottom-4 right-4 text-3xl opacity-50">{topic.coverIcon}</div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-white font-bold text-lg drop-shadow-lg">{topic.title}</h3>
        </div>
        <div className="absolute top-3 right-3 px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-white" />
          <span className="text-white text-xs font-medium">AI</span>
        </div>
      </div>
      <div className="p-4">
        <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 mb-3">
          {topic.description}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full">
              {topic.items.length}个内容
            </span>
          </div>
          <span className="text-xs text-gray-400 group-hover:text-primary-500 transition-colors">
            点击查看 →
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-20 bg-cream-50 dark:bg-gray-900">
      <header className="bg-gradient-to-b from-violet-400 to-violet-500 text-white safe-top">
        <div className="px-4 pt-4 pb-6">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-6 h-6" />
            <h1 className="text-xl font-bold">✨ 虚拟时光</h1>
          </div>
          <p className="text-white/80 text-sm">
            {currentBaby ? `想象${currentBaby.nickname || currentBaby.name}未来的美好时光` : 'AI生成的温馨未来场景'}
          </p>
        </div>
      </header>

      <main className="px-4 -mt-4 max-w-lg mx-auto">
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-4 mb-4 border border-amber-100 dark:border-amber-800">
          <p className="text-amber-800 dark:text-amber-200 text-sm flex items-start gap-2">
            <span className="text-lg">💫</span>
            <span>这里是AI想象的未来时光，内容仅供参考娱乐，希望能给您带来温暖和感动~</span>
          </p>
        </div>

        <div className="space-y-4">
          {virtualTimeTopics.map((topic) => (
            <TopicCard key={topic.id} topic={topic} />
          ))}
        </div>

        <div className="h-8" />
      </main>

      {/* 专题详情弹窗 */}
      {selectedTopic && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div 
            className="absolute bottom-0 left-0 right-0 max-h-[85vh] bg-cream-50 dark:bg-gray-900 rounded-t-3xl overflow-hidden animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`h-40 bg-gradient-to-br ${selectedTopic.coverGradient} relative`}>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-7xl animate-pulse">{selectedTopic.coverEmoji}</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
                <h2 className="text-white font-bold text-xl">{selectedTopic.title}</h2>
                <p className="text-white/80 text-sm mt-1">{selectedTopic.description}</p>
              </div>
              <button
                onClick={handleBack}
                className="absolute top-4 left-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <div className="absolute top-4 right-4 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-white" />
                <span className="text-white text-sm font-medium">AI生成</span>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[calc(85vh-10rem)] p-4 space-y-4">
              {selectedTopic.items.map((item) => (
                renderContentCard(item, selectedTopic)
              ))}

              <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 text-center">
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  💡 以上内容由AI生成，仅供娱乐参考
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                  希望能为您和家人带来温暖和快乐
                </p>
              </div>

              <div className="h-4" />
            </div>
          </div>
        </div>
      )}

      {/* 全屏查看弹窗 */}
      {fullscreenItem && (
        <div 
          className="fixed inset-0 z-[60] bg-black"
          onClick={closeFullscreen}
        >
          <button
            onClick={closeFullscreen}
            className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div 
            className="w-full h-full"
            onClick={(e) => e.stopPropagation()}
          >
            {renderFullscreenContent(fullscreenItem, selectedTopic)}
          </div>
        </div>
      )}
    </div>
  );
}

export default VirtualTimePage;
