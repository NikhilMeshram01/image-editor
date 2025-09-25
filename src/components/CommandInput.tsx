import React, { useState, useCallback } from 'react';
import { MessageSquare, Send, Loader2, Sparkles } from 'lucide-react';

interface CommandInputProps {
  canvas: HTMLCanvasElement | null;
  enabled: boolean;
  onProcessing: (processing: boolean) => void;
  onError: (message: string) => void;
}

interface CanvasCommand {
  action: 'draw_circle' | 'draw_rectangle' | 'adjust_brightness' | 'add_text';
  params: {
    x?: number;
    y?: number;
    radius?: number;
    width?: number;
    height?: number;
    color?: string;
    brightness?: number;
    text?: string;
    fontSize?: number;
  };
}

const CommandInput: React.FC<CommandInputProps> = ({
  canvas,
  enabled,
  onProcessing,
  onError
}) => {
  const [command, setCommand] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);

  // Parse natural language command using simple pattern matching
  // In production, this would use OpenAI API or a local NLP model
  const parseCommand = useCallback((input: string): CanvasCommand | null => {
    const lowercaseInput = input.toLowerCase().trim();

    // Draw circle patterns
    if (lowercaseInput.includes('circle')) {
      const colorMatch = lowercaseInput.match(/(red|blue|green|yellow|purple|orange|black|white|pink)/);
      const sizeMatch = lowercaseInput.match(/(\d+)\s*(px|pixel|pixels)/);

      return {
        action: 'draw_circle',
        params: {
          x: canvas ? canvas.width / 2 : 400,
          y: canvas ? canvas.height / 2 : 300,
          radius: sizeMatch ? parseInt(sizeMatch[1]) : 50,
          color: colorMatch ? colorMatch[1] : 'blue'
        }
      };
    }

    // Draw rectangle patterns
    if (lowercaseInput.includes('rectangle') || lowercaseInput.includes('square')) {
      const colorMatch = lowercaseInput.match(/(red|blue|green|yellow|purple|orange|black|white|pink)/);
      const sizeMatch = lowercaseInput.match(/(\d+)\s*(px|pixel|pixels)/);

      return {
        action: 'draw_rectangle',
        params: {
          x: canvas ? canvas.width / 2 - 50 : 350,
          y: canvas ? canvas.height / 2 - 50 : 250,
          width: sizeMatch ? parseInt(sizeMatch[1]) : 100,
          height: sizeMatch ? parseInt(sizeMatch[1]) : 100,
          color: colorMatch ? colorMatch[1] : 'green'
        }
      };
    }

    // Brightness adjustment patterns
    if (lowercaseInput.includes('bright') || lowercaseInput.includes('dark')) {
      const percentMatch = lowercaseInput.match(/(\d+)%/);
      const isDarken = lowercaseInput.includes('dark') || lowercaseInput.includes('dim');

      let brightness = percentMatch ? parseInt(percentMatch[1]) : 20;
      if (isDarken) brightness = -brightness;

      return {
        action: 'adjust_brightness',
        params: {
          brightness: brightness
        }
      };
    }

    // Add text patterns
    if (lowercaseInput.includes('text') || lowercaseInput.includes('write')) {
      const textMatch = lowercaseInput.match(/"([^"]+)"/);
      const colorMatch = lowercaseInput.match(/(red|blue|green|yellow|purple|orange|black|white|pink)/);

      return {
        action: 'add_text',
        params: {
          x: canvas ? canvas.width / 2 : 400,
          y: canvas ? canvas.height / 2 : 300,
          text: textMatch ? textMatch[1] : 'Hello World',
          color: colorMatch ? colorMatch[1] : 'white',
          fontSize: 24
        }
      };
    }

    return null;
  }, [canvas]);

  // Execute canvas command
  const executeCommand = useCallback((cmd: CanvasCommand) => {
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      switch (cmd.action) {
        case 'draw_circle':
          ctx.beginPath();
          ctx.arc(
            cmd.params.x || 0,
            cmd.params.y || 0,
            cmd.params.radius || 50,
            0,
            2 * Math.PI
          );
          ctx.fillStyle = cmd.params.color || 'blue';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();
          break;

        case 'draw_rectangle':
          ctx.fillStyle = cmd.params.color || 'green';
          ctx.fillRect(
            cmd.params.x || 0,
            cmd.params.y || 0,
            cmd.params.width || 100,
            cmd.params.height || 100
          );
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.strokeRect(
            cmd.params.x || 0,
            cmd.params.y || 0,
            cmd.params.width || 100,
            cmd.params.height || 100
          );
          break;

        case 'adjust_brightness':
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          const brightness = (cmd.params.brightness || 0) * 2.55; // Convert percentage to 0-255

          for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.max(0, Math.min(255, data[i] + brightness)); // Red
            data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + brightness)); // Green
            data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + brightness)); // Blue
          }

          ctx.putImageData(imageData, 0, 0);
          break;

        case 'add_text':
          ctx.font = `${cmd.params.fontSize || 24}px Arial`;
          ctx.fillStyle = cmd.params.color || 'white';
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 1;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          const text = cmd.params.text || 'Hello World';
          ctx.strokeText(text, cmd.params.x || 400, cmd.params.y || 300);
          ctx.fillText(text, cmd.params.x || 400, cmd.params.y || 300);
          break;
      }
    } catch (error) {
      throw new Error(`Failed to execute ${cmd.action}: ${error}`);
    }
  }, [canvas]);

  // Process natural language command
  const processCommand = useCallback(async () => {
    if (!command.trim() || !canvas) return;

    try {
      setIsLoading(true);
      onProcessing(true);

      // Simulate processing delay for realistic UX
      await new Promise(resolve => setTimeout(resolve, 500));

      // Parse the command
      const parsedCommand = parseCommand(command);

      if (!parsedCommand) {
        onError('Could not understand the command. Try: "draw red circle", "brighten 20%", or "add text Hello"');
        return;
      }

      // Execute the command
      executeCommand(parsedCommand);

      // Add to history
      setCommandHistory(prev => [...prev.slice(-4), command]); // Keep last 5 commands
      setCommand('');

    } catch (error) {
      onError(`Command failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
      onProcessing(false);
    }
  }, [command, canvas, parseCommand, executeCommand, onProcessing, onError]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processCommand();
  };

  // Example commands
  const exampleCommands = [
    'draw red circle',
    'draw blue rectangle 80px',
    'brighten image 30%',
    'add text "Hello World"',
    'darken image 15%'
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3 mb-4">
        <MessageSquare className="w-5 h-5 text-orange-400" />
        <h3 className="text-lg font-semibold text-white">Natural Language Commands</h3>
      </div>

      {/* Command Input */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="e.g., draw red circle, brighten 20%, add text..."
            disabled={!enabled || isLoading}
            className="w-full px-4 py-3 pr-12 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-400 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!enabled || !command.trim() || isLoading}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 text-white rounded-md transition-all disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </form>

      {/* Example Commands */}
      <div>
        <p className="text-sm text-gray-400 mb-2">
          <Sparkles className="inline w-4 h-4 mr-1" />
          Try these commands:
        </p>
        <div className="flex flex-wrap gap-1">
          {exampleCommands.map((example, index) => (
            <button
              key={index}
              onClick={() => setCommand(example)}
              disabled={!enabled || isLoading}
              className="text-xs px-2 py-1 bg-white/10 hover:bg-white/20 text-gray-300 rounded border border-white/10 hover:border-white/20 transition-all disabled:opacity-50"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {/* Command History */}
      {commandHistory.length > 0 && (
        <div>
          <p className="text-sm text-gray-400 mb-2">Recent commands:</p>
          <div className="space-y-1">
            {commandHistory.slice(-3).reverse().map((cmd, index) => (
              <div key={index} className="text-xs text-gray-500 px-2 py-1 bg-white/5 rounded">
                "{cmd}"
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• Supported: draw shapes, adjust brightness, add text</p>
        <p>• Colors: red, blue, green, yellow, purple, orange, pink, white, black</p>
        <p>• Sizes: specify pixels like "50px" or "100 pixels"</p>
      </div>
    </div>
  );
};

export default CommandInput;