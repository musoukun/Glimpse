export function TailwindTest() {
  return (
    <div className="p-4 space-y-4">
      <div className="bg-blue-500 text-white p-4 rounded-lg">
        <h4 className="text-lg font-bold">Tailwind CSS v4 動作確認</h4>
        <p className="mt-2">このボックスが青色の背景で表示されていれば、Tailwind CSSが正しく動作しています。</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-100 border border-green-300 p-3 rounded">
          <span className="text-green-800 font-medium">グリッド1</span>
        </div>
        <div className="bg-purple-100 border border-purple-300 p-3 rounded">
          <span className="text-purple-800 font-medium">グリッド2</span>
        </div>
      </div>
      
      <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded transition-colors">
        ホバーエフェクトテスト
      </button>
    </div>
  );
}