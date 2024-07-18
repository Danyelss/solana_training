use anchor_lang::prelude::*;

declare_id!("2omtYzE16svatZhByqzGiEoodUizJXETdrNHLgFv1N4H");

#[program]
pub mod first_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
