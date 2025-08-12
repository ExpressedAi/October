"use client";

import React, { useState, useCallback } from 'react';
import { ArrowLeft, Split, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SBSPromptLibrary } from '@/components/sbs/SBSPromptLibrary';
import { SBSPrompterPage } from '@/components/sbs/SBSPrompterPage';
import { SBSBuilderPage } from '@/components/sbs/SBSBuilderPage';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { SBSPrompt } from '@/lib/sbs-types';
import { INITIAL_RECEPTIVE_PROMPT } from '@/lib/sbs-constants';

export type SBSPage = 'prompter' | 'builder';

export default function SBSPromptingPage() {
  const [currentPage, setCurrentPage] = useState<SBSPage>('prompter');
  const [receptivePrompt, setReceptivePrompt] = useState<string>(INITIAL_RECEPTIVE_PROMPT);
  const [savedPrompts, setSavedPrompts] = useLocalStorage<SBSPrompt[]>('emergent-prompts', []);
  const [showLibrary, setShowLibrary] = useState<boolean>(true);

  const handleUseGeneratedPrompt = (promptContent: string) => {
    setReceptivePrompt(promptContent);
    setCurrentPage('prompter');
  };

  const handleDeletePrompt = (id: string) => {
    setSavedPrompts(savedPrompts.filter(p => p.id !== id));
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Chat
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-blue-600">
                  <Split className="inline h-6 w-6 mr-2" />
                  SBS Prompting
                </h1>
                <p className="text-muted-foreground text-sm">
                  Side-by-Side prompting with receptive frameworks and contextual queries
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={currentPage === 'prompter' ? 'default' : 'outline'}
                onClick={() => setCurrentPage('prompter')}
                size="sm"
              >
                Prompter
              </Button>
              <Button
                variant={currentPage === 'builder' ? 'default' : 'outline'}
                onClick={() => setCurrentPage('builder')}
                size="sm"
              >
                Builder
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLibrary(!showLibrary)}
              >
                <Menu className="h-4 w-4 mr-2" />
                {showLibrary ? 'Hide' : 'Show'} Library
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-120px)]">
        {/* Prompt Library Sidebar */}
        <SBSPromptLibrary 
          show={showLibrary} 
          setShow={setShowLibrary}
          prompts={savedPrompts}
          onSelect={setReceptivePrompt}
          onDelete={handleDeletePrompt}
        />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 gap-6 overflow-y-auto">
          {currentPage === 'prompter' && (
            <SBSPrompterPage 
              receptivePrompt={receptivePrompt}
              setReceptivePrompt={setReceptivePrompt}
              savedPrompts={savedPrompts}
              setSavedPrompts={setSavedPrompts}
            />
          )}
          {currentPage === 'builder' && (
            <SBSBuilderPage onUsePrompt={handleUseGeneratedPrompt} />
          )}
        </main>
      </div>
    </div>
  );
}