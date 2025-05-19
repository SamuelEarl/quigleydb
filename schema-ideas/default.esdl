# This file contains a GelDB schema (formerly EdgeDB), which is used for inspiration and as a reference for schema ideas for Quigley.

# TODO: Continue here:
# * Maybe when a user creates a budget or a bank transaction (on the bank-account page), then I will create Budget and BankTransaction nodes at that time. Maybe?
# * When a user deletes a NetWorthItem node with subtype = bankAccount, then I need to alert the user that they will also delete all the transactions and budget data related to that bank account.
# * I need to find out how to delete all child nodes of a (NetWorthItem {subtype:"bankAccount"}) node.

# TODO: Are there other budget items from the Summary.svelte component that should be properties in the Budget table?

module default {
  scalar type UserRoles extending enum<member, admin>;

  # Since most of the queries start by finding the User node whose id matches a given value or the UserAccount node whose id matches a given value, I was going to create indexes on the User.id field and/or UserAccount.id field.
  # However, there is no need to create indexes the User.id or UserAccount.id fields because the `id` property, all links, and all properties with `exclusive` constraints are automatically indexed. (See https://docs.geldata.com/learn/schema#indexes)
  type User {
    authServerUserId: str;
    firstName: str;
    lastName: str;
    preferredName: str;
    required email: str;
    avatar: str;
    roles: array<UserRoles> {
      default := [ UserRoles.member ];
    };
    preferences: UserPreferences {
      constraint exclusive;
    };
    required createdAt: str;
    required userAccount: UserAccount;
  }

  # See my note about indexes above the User object type.
  type UserAccount {
    required permissions: array<str>;
    required createdAt: str;
    multi netWorthItems: NetWorthItem;
    multi users := .<userAccount[is User]; # Create a backlink that references all users that belong to this account. In other words, this `users` backlink will return all `User` objects with a link called `userAccount` that points to the current `UserAccount`. See https://docs.geldata.com/learn/schema#backlinks.
  }

  # The "bubble" layout would probably use something like a D3.js Bubble Chart where categories or items that have more money allocated to them would be represented with larger bubbles and there would be a dial around the outside of the bubble that represents how much they have spent of that allocated amount. USAA's budget app does a pretty nice job with their bubble-style budgeting app.
  # The "mindMap" layout would probably use something like the D3.js Force Directed Graph.
  scalar type BudgetLayout extending enum<table, bubble, mindMap>;
  scalar type Theme extending enum<light, dark>;

  type UserPreferences {
    budgetLayout: BudgetLayout {
      default := BudgetLayout.table;
    };
    theme: Theme {
      default := Theme.light;
    };
  }

  type NetWorthItem {
    required type: str;
    required subtype: str;
    required name: str;
    required value: int64 {
      default := 0;
    }; # I will store dollar amounts as integers and the last 2 digits will represent the cents. The frontend will display the integer amounts as decimals. I will convert the decimal amounts in the frontend to integer amounts before they are stored in the database. And I will convert the integer amounts from the database to decimal amounts before they are displayed in the frontend.
    loginURL: str;
    required sortOrder: int16;
    required createdAt: str;
    # required multi userAccount: UserAccount;
    multi bankTransactions: BankTransaction;
    multi budgets: Budget;
  }

  scalar type Status extending enum<NONE, PENDING, CLEARED, REJECTED, BOUNCED>;

  type BankTransaction {
    required year: int16;
    required monthName: str;
    required monthNumber: int16;
    description: str;
    required amount: int64 {
      default := 0;
    }; # See my comment above about dollar amounts.
    required date: str;
    required category: BankTransactionCategory {
      constraint exclusive;
    };
    status: Status {
      default := Status.NONE;
    };
    notes: str;
    subtransactions: json;
    # multi netWorthItem: NetWorthItem;
  }

  # UPDATE: The "subtransactions" column is set as a JSON column in the "BankTransactions" table.
  # TODO: How should I model subtransactions in the database? Each transaction record should have a `subtransactions` property that is an array of objects with a similar data structure as the transactions objects. When a user creates a new transaction, it will be sent to the backend where an ID will be created for each transaction. When updates are made to the transactions, then those updates will be made by transaction ID. 
  # * The parent transaction will have a `category` of "Split Transaction" and its `amount` field will be calculated by adding the child transactions.
  # * The child transactions will inherit their `date` and `status` fields from the parent transaction.
  # ----------------------------------------
  # type Subtransactions {
  #   description: str;
  #   amount: int64 {
  #      default := 0;
  #   }; # See my comment above about dollar amounts.
  #   category: BankTransactionCategory;
  #   notes: str;
  # }
  # ----------------------------------------

  type BankTransactionCategory {
    cashFlowType: str;
    option: str;
  }

  type Budget {
    required year: int16;
    required monthName: str;
    required monthNumber: int16;
    categories: array<str>;
    # required multi netWorthItem: NetWorthItem;
  }
}
