interface StreamingPreviewProps {
  streamedText: string;
}

export function StreamingPreview({ streamedText }: StreamingPreviewProps) {
  return (
    <div className="streaming-preview">
      <div className="streaming-progress">
        生成中... [已生成 {streamedText.length} 字]
      </div>
      <pre className="streaming-text">
        {streamedText}
        <span className="streaming-cursor">|</span>
      </pre>
    </div>
  );
}
