import { Context, Markup, Telegraf, session } from 'telegraf';
import dotenv from 'dotenv';
// import { Account } from "viem";
import admin from 'firebase-admin';
import serviceAccount from './credential.json';
import { message } from 'telegraf/filters';
//@ts-ignore
import firebaseSession from 'telegraf-session-firebase';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { formatGwei } from 'viem';
import { Offer, SessionData } from './src/types/common';
import { client } from './src/utils/client';
import { fetchAccountBalances } from './src/utils/accounts';
// import { telos } from 'viem/chains';
import { useTokenDetails } from './src/utils/getters';
// import { AxiosResponse } from 'axios';
import { buy } from './src/utils/actions';
import { encryptPrivateKey } from './src/utils/encryptions';
// import { testEncryption } from './src/utils/encryptions';
dotenv.config();
const API_TOKEN = process.env.API_TOKEN;

// testEncryption();

interface BotContext extends Context {
  session: SessionData;
}
const bot = new Telegraf<BotContext>(API_TOKEN ?? '');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as any),
  databaseURL: 'https://tg-bot-1de62-default-rtdb.firebaseio.com',
});
const database = admin.database();

// bot.use(session())
bot.use(firebaseSession(database.ref('sessions')));

// const mainMenuKeyboard = Markup.inlineKeyboard([
//     Markup.button.callback('🌟 Option 1', 'option1'),
//     Markup.button.callback('🚀 Option 2', 'option2'),
//     Markup.button.callback('➡️ Show Submenu', 'submenu'),
// ],);

const mainMenuKeyboard = {
  inline_keyboard: [
    [
      { text: '🤑 Buy', callback_data: 'buy' },
      { text: '💲 Sell', callback_data: 'sell' },
      { text: '📔 Wallets', callback_data: 'wallets' },
    ],
    [
      { text: '⚙️ Settings', callback_data: 'settings' },
      { text: '📊 Watchlist', callback_data: 'watchlist' },
    ],
  ],
};

const walletsMenuKeyboard = {
  inline_keyboard: [
    [
      { text: '📥 Import', callback_data: 'import' },
      { text: '🚮 Delete', callback_data: 'delete-wallet' },
      // { text: "📔 Wallets", callback_data: 'wallets' }
    ],
    [{ text: '📤 Export', callback_data: 'export' }],
    [{ text: '🏠 Main Menu', callback_data: 'settings' }],
  ],
};
const submenuKeyboard = Markup.inlineKeyboard([
  Markup.button.callback('🔵 Submenu Option 1', 'submenu_option1'),
  Markup.button.callback('⬅️ Back to Main Menu', 'back_to_main'),
]);

bot.use((ctx, next) => {
  const start = Date.now();
  return next().then(() => {
    const ms = Date.now() - start;
    console.log('response time %sms', ms);
  });
});

bot.command('menu', (ctx) => {
  const keyboard = {
    inline_keyboard: [
      [
        { text: '🌟 Option 1', callback_data: '1' },
        { text: '🚀 Option 2', callback_data: '2' },
        { text: '🚀 Option 3', callback_data: '3' },
      ],
      [
        { text: '⬅️ Option 4', callback_data: '4' },
        { text: '➡️ Option 5', callback_data: '5' },
      ],
    ],
  };

  ctx.reply('Choose an option:', {
    reply_markup: keyboard,
  });
});

bot.command('start', async (ctx) => {
  ctx.session ??= { selectedOption: '', accounts: [] };
  console.log('user id', ctx.from.id, ctx);

  if (ctx.session.accounts?.length === 0 || !ctx.session.accounts) {
    // const privateKey = generatePrivateKey()
    // const accounts = privateKeyToAccount(privateKey)
    // ctx.session.accounts = [accounts.address]

    const accounts = await Promise.all(
      [1, 2].map(async () => {
        const privateKey = generatePrivateKey();
        const account = privateKeyToAccount(privateKey);
        const encryptedKey = await encryptPrivateKey(
          account.address,
          privateKey
        );
        // const encryptionKey=
        return {
          privateKey: encryptedKey,
          address: account.address,
        };
      })
    );
    console.log(accounts);
    ctx.session.accounts = accounts;
    const messageId = ctx.message.message_id;
    ctx.deleteMessage(messageId);

    ctx.replyWithMarkdown(
      `👋 *Welcome to Akerra Bot* \n \n _To get started:_ \n 💰 Check your wallets and fund with /wallets`
    );
  } else {
    // console.log(formatGwei(((await client.getBlock()).baseFeePerGas ?? BigInt(0)) * ((await client.getBlock()).gasLimit ?? BigInt(0))))
    // const feeData = await client.getGasPrice()

    // console.log(formatGwei(feeData))

    const [gas, blockDetails] = await Promise.all([
      formatGwei(await client.getGasPrice()),
      client.getBlock(),
    ]);
    // console.log(formatGwei(feeData.gasLimit * (feeData.baseFeePerGas ?? BigInt(0))), feeData.gas, feeData.timestamp)

    // ctx.reply(`Welcome back, your address is ${ctx.session.accounts[0].address}`)
    const accountWithBalances = await fetchAccountBalances(
      ctx.session.accounts
    );
    ctx.replyWithMarkdown(
      `⛽ *Gas:* ${gas}  *🧱 Block:* ${blockDetails.number} \n\n` +
        `${accountWithBalances.map(
          (account, index) =>
            `Wallet-${index}: ${account.address} \n ETH: ${account.balance} \n\n`
        )}`.replace(',', ''),
      { reply_markup: mainMenuKeyboard }
    );
    const messageId = ctx.message.message_id;
    // ctx.deleteMessage(messageId)
  }
});

bot.command('test', (ctx) => {
  ctx.replyWithMarkdown(`
    *Hello!* Welcome to my bot.

    Here's an example of *bold* and _italic_ text.
    [Visit my website](https://example.com).
  `);
});

bot.action(['1', '2'], (ctx) => {
  // Store the selected option in the context
  ctx.session ??= { selectedOption: '', accounts: [] };
  ctx.session.selectedOption = ctx.match[0];

  // Render another menu or perform evaluation based on the selected option
  const newKeyboard = {
    inline_keyboard: [
      [
        { text: 'Suboption A', callback_data: 'A' },
        { text: 'Suboption B', callback_data: 'B' },
      ],
    ],
  };

  ctx.editMessageText(
    `You selected Option ${ctx.session.selectedOption}. Choose a suboption:`,
    {
      reply_markup: newKeyboard,
    }
  );
});

bot.action(['A', 'B'], (ctx) => {
  // Access both the selected option and the suboption
  const selectedOption = ctx.session.selectedOption;
  const subOption = ctx.match[0];

  // Use the selected option and suboption as needed
  // ctx.reply(`You selected Option ${selectedOption} and Suboption ${subOption}. Performing evaluation...`);
  // ctx.telegram

  ctx.replyWithMarkdownV2(
    `You selected Option ${selectedOption} and Suboption ${subOption}. Performing evaluation...`
  );

  // Now you can use the selected option and suboption for further processing
  // For example, you can save them to a database, perform calculations, etc.
});

// bot.start((ctx) => {
//     ctx.reply('Main Menu', mainMenuKeyboard);
// });
bot.command('new', (ctx) => {
  ctx.reply('Main Menu', { reply_markup: mainMenuKeyboard });
});
bot.action('buy', (ctx) => {
  ctx.reply(
    'Enter your the token address you wish to buy:',
    Markup.forceReply()
  );
});
bot.action('delete-wallet', (ctx) => {
  ctx.reply('Select wallet to delete', {
    reply_markup: {
      inline_keyboard: [
        ctx.session.accounts.map((item, id) => ({
          text: `wallet ${id}`,
          callback_data: `delete-wallet-${id}`,
        })),
      ],
    },
  });
});
bot.action('submenu', (ctx) => {
  ctx.reply('Submenu', submenuKeyboard);
});

bot.action(/delete-wallet-\d+/, (ctx) => {
  const action = ctx.match[0]; // Extract the matched part of the action
  const sections = action.split('-');
  const index = Number(sections[sections.length - 1]);
  ctx.session.accounts.splice(index, 1);

  // ctx.session.accounts = newAccounts

  ctx.reply(`Wallet successfully deleted`);
});

bot.action('wallets', async (ctx) => {
  console.log('here');
  const accountWithBalances = await fetchAccountBalances(ctx.session.accounts);
  console.log('accts', accountWithBalances);
  ctx.replyWithMarkdown(
    `⛽ *Wallets*  \n\n` +
      `${accountWithBalances.map(
        (account, index) =>
          `Wallet-${index}: ${account.address} \n ETH: ${account.balance} \n\n`
      )}`.replace(',', ''),
    { reply_markup: walletsMenuKeyboard }
  );
});

bot.action(/buy-with-\d+/, (ctx) => {
  const action = ctx.match[0]; // Extract the matched part of the action
  const sections = action.split('-');
  const index = Number(sections[sections.length - 1]);
  ctx.session.selectedWallet = index;
  ctx.reply('Enter amount to buy in FTM:', Markup.forceReply());
});

bot.action('import', (ctx) => {
  ctx.reply('Please enter your private key:', Markup.forceReply());
});

bot.on(message('text'), async (ctx) => {
  const userInput = ctx.message.text;
  console.log(ctx.message.reply_to_message);

  if (
    ctx.message.reply_to_message &&
    // ctx.message.reply_to_message.text &&
    //@ts-ignore
    ctx.message.reply_to_message.text === 'Enter amount to buy in FTM:'
  ) {
    try {
      const offer: Offer = {
        adapter: ctx.session.adapter!,
        tokenIn: ctx.session.tokenIn!,
        tokenOut: ctx.session.tokenOut!,
        amountOut: ctx.session.amountOut,
      };
      const swap = await buy(
        ctx.session.tradeToken!,
        userInput,
        offer,
        ctx.session.accounts[ctx.session.selectedWallet!]
      );
      ctx.reply(`✅ Swap successfull with hash ${swap}`);
    } catch (err) {
      console.log(err);
      ctx.reply('🚫 Swap failed');
    }
  }

  // Check if the message is a reply to a force input
  if (
    ctx.message.reply_to_message &&
    // ctx.message.reply_to_message.text &&
    //@ts-ignore
    ctx.message.reply_to_message.text === 'Please enter your private key:'
  ) {
    try {
      const account = privateKeyToAccount(userInput as any);
      const encryptedKey = await encryptPrivateKey(account.address, userInput);
      ctx.session.accounts.push({
        address: account.address,
        privateKey: encryptedKey,
      });
      ctx.reply(`✅ Account imported successfully`);
    } catch {
      ctx.reply(`🚫 Invalid Private Key`);
    }
  } else if (
    ctx.message.reply_to_message &&
    (ctx.message.reply_to_message as any).text ===
      'Enter your the token address you wish to buy:'
  ) {
    try {
      const response: any = await useTokenDetails(userInput);
      ctx.session.tradeToken = userInput;
      const offer = response.price as Offer;
      ctx.session.adapter = offer.adapter;
      ctx.session.tokenIn = offer.tokenIn;
      ctx.session.tokenOut = offer.tokenOut;
      ctx.session.amountOut = Number(offer.amountOut);
      ctx.replyWithMarkdown(
        `*Token Details* \n\n*Name:* ${response.name}\n*Symbol:* ${
          response.symbol
        }\n*Total Sypply:* ${response.totalSupply}\n*Decimals:*${
          response.decimals
        }\n*Token Health:*${response.health}\n*Price:* ${
          1 / Number((response.price as any).amountOut)
        } FTM`,
        {
          reply_markup: {
            inline_keyboard: [
              ctx.session.accounts.map((item, id) => ({
                text: `wallet ${id}`,
                callback_data: `buy-with-${id}`,
              })),
            ],
          },
        }
      );
      console.log(response);
    } catch (error) {
      ctx.reply('🚫 Error Fetching Address');
    }
  }
});

bot.action('back_to_main', (ctx) => {
  ctx.reply('Main Menu', { reply_markup: mainMenuKeyboard });
});

// Start the bot
bot.launch();
