use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, Transfer, MintTo, Burn},
};

declare_id!("49CJcqADMbvtbEn4ZCuEJakif6wsue4RAaPrSp5SfdEB");

const POOL_SEED: &[u8] = b"pool";
const LP_MINT_SEED: &[u8] = b"lp_mint";
const POOL_TOKEN_A_SEED: &[u8] = b"pool_token_a";
const POOL_TOKEN_B_SEED: &[u8] = b"pool_token_b";

const FEE_DENOMINATOR: u64 = 1000;
const FEE_NUMERATOR: u64 = 3; // 0.3% fee

#[program]
pub mod simple_amm {
    use super::*;

    pub fn initialize_pool(ctx: Context<InitializePool>) -> Result<()> {
        let pool = &mut ctx.accounts.pool;

        pool.token_a_mint = ctx.accounts.token_a_mint.key();
        pool.token_b_mint = ctx.accounts.token_b_mint.key();
        pool.lp_mint = ctx.accounts.lp_mint.key();
        pool.token_a_reserve = ctx.accounts.pool_token_a.key();
        pool.token_b_reserve = ctx.accounts.pool_token_b.key();
        pool.total_lp_supply = 0;
        pool.bump = ctx.bumps.pool;

        msg!("Pool initialized with token A: {:?}, token B: {:?}",
            pool.token_a_mint, pool.token_b_mint);

        Ok(())
    }

    pub fn deposit_liquidity(
        ctx: Context<DepositLiquidity>,
        amount_a: u64,
        amount_b: u64,
        min_lp_tokens: u64,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool;

        require!(amount_a > 0 && amount_b > 0, ErrorCode::InvalidAmount);

        let lp_tokens_to_mint = if pool.total_lp_supply == 0 {
            // Initial deposit - use geometric mean
            let lp_tokens = (amount_a as u128)
                .checked_mul(amount_b as u128)
                .unwrap()
                .integer_sqrt() as u64;

            require!(lp_tokens > 0, ErrorCode::InsufficientLiquidity);
            lp_tokens
        } else {
            // Subsequent deposits - maintain ratio
            let reserve_a = ctx.accounts.pool_token_a.amount;
            let reserve_b = ctx.accounts.pool_token_b.amount;

            let lp_from_a = (amount_a as u128)
                .checked_mul(pool.total_lp_supply as u128)
                .unwrap()
                .checked_div(reserve_a as u128)
                .unwrap() as u64;

            let lp_from_b = (amount_b as u128)
                .checked_mul(pool.total_lp_supply as u128)
                .unwrap()
                .checked_div(reserve_b as u128)
                .unwrap() as u64;

            // Use minimum to maintain ratio
            lp_from_a.min(lp_from_b)
        };

        require!(lp_tokens_to_mint >= min_lp_tokens, ErrorCode::SlippageExceeded);

        // Transfer token A from user to pool
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.user_token_a.to_account_info(),
                    to: ctx.accounts.pool_token_a.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            amount_a,
        )?;

        // Transfer token B from user to pool
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.user_token_b.to_account_info(),
                    to: ctx.accounts.pool_token_b.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            amount_b,
        )?;

        // Mint LP tokens to user
        let seeds = &[
            POOL_SEED,
            pool.token_a_mint.as_ref(),
            pool.token_b_mint.as_ref(),
            &[pool.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.lp_mint.to_account_info(),
                    to: ctx.accounts.user_lp_token.to_account_info(),
                    authority: pool.to_account_info(),
                },
                signer_seeds,
            ),
            lp_tokens_to_mint,
        )?;

        pool.total_lp_supply = pool.total_lp_supply.checked_add(lp_tokens_to_mint).unwrap();

        msg!("Deposited {} token A, {} token B, minted {} LP tokens",
            amount_a, amount_b, lp_tokens_to_mint);

        Ok(())
    }

    pub fn withdraw_liquidity(
        ctx: Context<WithdrawLiquidity>,
        lp_token_amount: u64,
        min_amount_a: u64,
        min_amount_b: u64,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool;

        require!(lp_token_amount > 0, ErrorCode::InvalidAmount);
        require!(pool.total_lp_supply > 0, ErrorCode::InsufficientLiquidity);

        let reserve_a = ctx.accounts.pool_token_a.amount;
        let reserve_b = ctx.accounts.pool_token_b.amount;

        // Calculate amounts to withdraw based on LP token share
        let amount_a = (reserve_a as u128)
            .checked_mul(lp_token_amount as u128)
            .unwrap()
            .checked_div(pool.total_lp_supply as u128)
            .unwrap() as u64;

        let amount_b = (reserve_b as u128)
            .checked_mul(lp_token_amount as u128)
            .unwrap()
            .checked_div(pool.total_lp_supply as u128)
            .unwrap() as u64;

        require!(amount_a >= min_amount_a && amount_b >= min_amount_b, ErrorCode::SlippageExceeded);

        // Burn LP tokens from user
        token::burn(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Burn {
                    mint: ctx.accounts.lp_mint.to_account_info(),
                    from: ctx.accounts.user_lp_token.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            lp_token_amount,
        )?;

        // Transfer token A from pool to user
        let seeds = &[
            POOL_SEED,
            pool.token_a_mint.as_ref(),
            pool.token_b_mint.as_ref(),
            &[pool.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.pool_token_a.to_account_info(),
                    to: ctx.accounts.user_token_a.to_account_info(),
                    authority: pool.to_account_info(),
                },
                signer_seeds,
            ),
            amount_a,
        )?;

        // Transfer token B from pool to user
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.pool_token_b.to_account_info(),
                    to: ctx.accounts.user_token_b.to_account_info(),
                    authority: pool.to_account_info(),
                },
                signer_seeds,
            ),
            amount_b,
        )?;

        pool.total_lp_supply = pool.total_lp_supply.checked_sub(lp_token_amount).unwrap();

        msg!("Burned {} LP tokens, withdrew {} token A, {} token B",
            lp_token_amount, amount_a, amount_b);

        Ok(())
    }

    pub fn swap(
        ctx: Context<Swap>,
        amount_in: u64,
        minimum_amount_out: u64,
        is_a_to_b: bool,
    ) -> Result<()> {
        let pool = &ctx.accounts.pool;

        require!(amount_in > 0, ErrorCode::InvalidAmount);

        let (reserve_in, reserve_out) = if is_a_to_b {
            (ctx.accounts.pool_token_a.amount, ctx.accounts.pool_token_b.amount)
        } else {
            (ctx.accounts.pool_token_b.amount, ctx.accounts.pool_token_a.amount)
        };

        // Calculate amount out with fee (0.3%)
        // amount_out = (amount_in * (1 - fee) * reserve_out) / (reserve_in + amount_in * (1 - fee))
        let amount_in_with_fee = (amount_in as u128)
            .checked_mul((FEE_DENOMINATOR - FEE_NUMERATOR) as u128)
            .unwrap();

        let numerator = amount_in_with_fee
            .checked_mul(reserve_out as u128)
            .unwrap();

        let denominator = (reserve_in as u128)
            .checked_mul(FEE_DENOMINATOR as u128)
            .unwrap()
            .checked_add(amount_in_with_fee)
            .unwrap();

        let amount_out = numerator.checked_div(denominator).unwrap() as u64;

        require!(amount_out >= minimum_amount_out, ErrorCode::SlippageExceeded);
        require!(amount_out > 0 && amount_out < reserve_out, ErrorCode::InsufficientLiquidity);

        let seeds = &[
            POOL_SEED,
            pool.token_a_mint.as_ref(),
            pool.token_b_mint.as_ref(),
            &[pool.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        if is_a_to_b {
            // Transfer token A from user to pool
            token::transfer(
                CpiContext::new(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.user_token_a.to_account_info(),
                        to: ctx.accounts.pool_token_a.to_account_info(),
                        authority: ctx.accounts.user.to_account_info(),
                    },
                ),
                amount_in,
            )?;

            // Transfer token B from pool to user
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.pool_token_b.to_account_info(),
                        to: ctx.accounts.user_token_b.to_account_info(),
                        authority: pool.to_account_info(),
                    },
                    signer_seeds,
                ),
                amount_out,
            )?;
        } else {
            // Transfer token B from user to pool
            token::transfer(
                CpiContext::new(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.user_token_b.to_account_info(),
                        to: ctx.accounts.pool_token_b.to_account_info(),
                        authority: ctx.accounts.user.to_account_info(),
                    },
                ),
                amount_in,
            )?;

            // Transfer token A from pool to user
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.pool_token_a.to_account_info(),
                        to: ctx.accounts.user_token_a.to_account_info(),
                        authority: pool.to_account_info(),
                    },
                    signer_seeds,
                ),
                amount_out,
            )?;
        }

        msg!("Swapped {} for {} (A to B: {})", amount_in, amount_out, is_a_to_b);

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializePool<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + Pool::INIT_SPACE,
        seeds = [POOL_SEED, token_a_mint.key().as_ref(), token_b_mint.key().as_ref()],
        bump
    )]
    pub pool: Account<'info, Pool>,

    #[account(
        init,
        payer = payer,
        seeds = [LP_MINT_SEED, token_a_mint.key().as_ref(), token_b_mint.key().as_ref()],
        bump,
        mint::decimals = 6,
        mint::authority = pool,
    )]
    pub lp_mint: Account<'info, Mint>,

    pub token_a_mint: Account<'info, Mint>,
    pub token_b_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = payer,
        seeds = [POOL_TOKEN_A_SEED, pool.key().as_ref()],
        bump,
        token::mint = token_a_mint,
        token::authority = pool,
    )]
    pub pool_token_a: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = payer,
        seeds = [POOL_TOKEN_B_SEED, pool.key().as_ref()],
        bump,
        token::mint = token_b_mint,
        token::authority = pool,
    )]
    pub pool_token_b: Account<'info, TokenAccount>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct DepositLiquidity<'info> {
    #[account(
        mut,
        seeds = [POOL_SEED, pool.token_a_mint.as_ref(), pool.token_b_mint.as_ref()],
        bump = pool.bump
    )]
    pub pool: Account<'info, Pool>,

    #[account(
        mut,
        seeds = [LP_MINT_SEED, pool.token_a_mint.as_ref(), pool.token_b_mint.as_ref()],
        bump,
    )]
    pub lp_mint: Account<'info, Mint>,

    #[account(
        mut,
        seeds = [POOL_TOKEN_A_SEED, pool.key().as_ref()],
        bump,
    )]
    pub pool_token_a: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [POOL_TOKEN_B_SEED, pool.key().as_ref()],
        bump,
    )]
    pub pool_token_b: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user_token_a: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user_token_b: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user_lp_token: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct WithdrawLiquidity<'info> {
    #[account(
        mut,
        seeds = [POOL_SEED, pool.token_a_mint.as_ref(), pool.token_b_mint.as_ref()],
        bump = pool.bump
    )]
    pub pool: Account<'info, Pool>,

    #[account(
        mut,
        seeds = [LP_MINT_SEED, pool.token_a_mint.as_ref(), pool.token_b_mint.as_ref()],
        bump,
    )]
    pub lp_mint: Account<'info, Mint>,

    #[account(
        mut,
        seeds = [POOL_TOKEN_A_SEED, pool.key().as_ref()],
        bump,
    )]
    pub pool_token_a: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [POOL_TOKEN_B_SEED, pool.key().as_ref()],
        bump,
    )]
    pub pool_token_b: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user_token_a: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user_token_b: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user_lp_token: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Swap<'info> {
    #[account(
        seeds = [POOL_SEED, pool.token_a_mint.as_ref(), pool.token_b_mint.as_ref()],
        bump = pool.bump
    )]
    pub pool: Account<'info, Pool>,

    #[account(
        mut,
        seeds = [POOL_TOKEN_A_SEED, pool.key().as_ref()],
        bump,
    )]
    pub pool_token_a: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [POOL_TOKEN_B_SEED, pool.key().as_ref()],
        bump,
    )]
    pub pool_token_b: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user_token_a: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user_token_b: Account<'info, TokenAccount>,

    pub user: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

#[account]
#[derive(InitSpace)]
pub struct Pool {
    pub token_a_mint: Pubkey,
    pub token_b_mint: Pubkey,
    pub lp_mint: Pubkey,
    pub token_a_reserve: Pubkey,
    pub token_b_reserve: Pubkey,
    pub total_lp_supply: u64,
    pub bump: u8,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid amount provided")]
    InvalidAmount,
    #[msg("Insufficient liquidity in the pool")]
    InsufficientLiquidity,
    #[msg("Slippage tolerance exceeded")]
    SlippageExceeded,
}

// Helper trait for integer square root
trait IntegerSquareRoot {
    fn integer_sqrt(self) -> Self;
}

impl IntegerSquareRoot for u128 {
    fn integer_sqrt(self) -> Self {
        if self < 2 {
            return self;
        }

        let mut x = self;
        let mut y = (x + 1) / 2;

        while y < x {
            x = y;
            y = (x + self / x) / 2;
        }

        x
    }
}
