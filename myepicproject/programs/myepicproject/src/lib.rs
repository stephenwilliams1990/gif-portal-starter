use anchor_lang::prelude::*;

// this is the program id, which has info for Solana on how to run our program
declare_id!("2LYf1XjsWPDo8CYhbB63kvN7veH5RtdCQu8QPLYo2w5t");

#[program]
pub mod myepicproject {
    use super::*;
    pub fn initialize(ctx: Context<Initialize>, base_account_bump: u8) -> ProgramResult {
        ctx.accounts.base_account.bump = base_account_bump;
        Ok(())
    }

    pub fn add_gif(ctx: Context<AddGif>, gif_link: String) -> ProgramResult {
        let base_account = &mut ctx.accounts.base_account;
        let user = &mut ctx.accounts.user;
        
        // Build the struct
        let item = ItemStruct {
            gif_link: gif_link.to_string(),
            user_address: *user.to_account_info().key,
            votes: 0,
            voters: [].to_vec(),
        };

        base_account.gif_list.push(item);
        base_account.total_gifs += 1;
        Ok(())
    }

    pub fn update_item(ctx: Context<UpdateItem>, gif_link: String) -> ProgramResult {
        let base_account = &mut ctx.accounts.base_account;
        let user = &mut ctx.accounts.user;
        
        let mut update = true;
        let mut index = 0;
        for (i, x) in base_account.gif_list.iter().enumerate() {
            if x.gif_link == gif_link {
                if x.voters.contains(&*user.to_account_info().key) {
                    update = false;
                }
                index = i;
                
            };
        };
        
        if update {
            base_account.gif_list[index].votes += 1;
            base_account.gif_list[index].voters.push(*user.to_account_info().key);
        }
        
        Ok(())
    }

    pub fn send_tip(ctx: Context<SendTip>, amount: u64) -> ProgramResult {
        let from_account = &mut ctx.accounts.user;
        let to_account = &mut ctx.accounts.to;

        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &from_account.key(),
            &to_account.key(),
            amount,
        );

        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                from_account.to_account_info(),
                to_account.to_account_info(),
            ]
        );
        
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(base_account_bump: u8)]
pub struct Initialize<'info> {
    #[account(init, seeds = [b"seinfeld".as_ref()], bump = base_account_bump, payer = user, space = 9000)]
    pub base_account: Account<'info, BaseAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AddGif<'info> {
    #[account(mut)]
    pub base_account: Account<'info, BaseAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdateItem<'info> {
    #[account(mut)]
    pub base_account: Account<'info, BaseAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct SendTip<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut)]
    pub to: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

// Create a custom struct to work with
#[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct ItemStruct {
    pub gif_link: String,
    pub user_address: Pubkey,
    pub votes: u64,
    pub voters: Vec<Pubkey>,
}

#[account]
#[derive(Default)]
pub struct BaseAccount {
    pub total_gifs: u64,
    pub gif_list: Vec<ItemStruct>,
    pub bump: u8,
}
