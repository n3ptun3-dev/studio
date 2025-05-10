'use server';

/**
 * @fileOverview Generates a personalized welcome message from HQ for returning players.
 *
 * - generateWelcomeMessage - A function that generates the welcome message.
 * - WelcomeMessageInput - The input type for the generateWelcomeMessage function.
 * - WelcomeMessageOutput - The return type for the generateWelcomeMessage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const WelcomeMessageInputSchema = z.object({
  playerName: z.string().describe('The name of the player.'),
  faction: z.string().describe('The player\u0027s faction (Cyphers or Shadows).'),
  elintReserves: z.number().describe('The player\u0027s current ELINT balance.'),
  networkActivity: z.string().describe('The current level of network activity (High, Medium, Low).'),
  vaultDefenses: z.string().describe('The status of the player\u0027s vault defenses (Holding, Weakened).'),
});
export type WelcomeMessageInput = z.infer<typeof WelcomeMessageInputSchema>;

const WelcomeMessageOutputSchema = z.object({
  message: z.string().describe('The AI-generated welcome message from HQ.'),
});
export type WelcomeMessageOutput = z.infer<typeof WelcomeMessageOutputSchema>;

export async function generateWelcomeMessage(input: WelcomeMessageInput): Promise<WelcomeMessageOutput> {
  return welcomeMessageFlow(input);
}

const welcomeMessagePrompt = ai.definePrompt({
  name: 'welcomeMessagePrompt',
  input: {schema: WelcomeMessageInputSchema},
  output: {schema: WelcomeMessageOutputSchema},
  prompt: `You are HQ, providing a daily welcome message to agent {{playerName}} of the {{faction}} faction.\n\nConsider the following game state to provide an engaging welcome message and a call to action:\n- ELINT Reserves: {{elintReserves}}\n- Network Activity: {{networkActivity}}\n- Vault Defenses: {{vaultDefenses}}\n\nCraft a short, spy-themed message. Include a call to action based on the game state.\n`,
});

const welcomeMessageFlow = ai.defineFlow(
  {
    name: 'welcomeMessageFlow',
    inputSchema: WelcomeMessageInputSchema,
    outputSchema: WelcomeMessageOutputSchema,
  },
  async input => {
    const {output} = await welcomeMessagePrompt(input);
    return output!;
  }
);
