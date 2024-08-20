pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("FKbe8EydAbQe1tDH6KQWpT2VEawmGZCkJTnbYjUP4bSf");

#[program]
pub mod escrow {
    use anchor_lang::context;

    use super::*;

    pub fn make_offer(
        context: Context<MakeOffer>,
        id: u64,
        token_a_offered_amount: u64,
        token_b_wanted_amount: u64,
    ) -> Result<()> {
        instructions::make_offer::send_offered_tokens_to_vault(&context, token_a_offered_amount)?;
        instructions::make_offer::save_offer(context, id, token_b_wanted_amount)
    }

    pub fn take_offer(
        context: Context<TakeOffer>,
        id: u64,
    ) -> Result<()> {
        let offer = instructions::take_offer::get_offer_details(&context, id)?;

        instructions::take_offer::send_wanted_tokens_to_vault(&context, offer.token_b_wanted_amount)?;
        instructions::take_offer::send_offered_tokens_to_taker(&context, offer.token_a_offered_amount)?;
        instructions::take_offer::send_wanted_tokens_to_maker(&context, offer.token_b_wanted_amount)?;
        instructions::take_offer::mark_offer_as_completed(&context, id)?;

        Ok(())
    }
}
