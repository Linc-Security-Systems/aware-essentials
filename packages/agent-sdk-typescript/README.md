# Agent Typescript SDK
An SDK that helps build an agent in Javascript / Typescript. An agent is a process written in any programming language, responsible for connecting devices of partner technologies in the area of perimeter security.

# Agent Responsibilities and Guidelines
AWARE platform is a one-stop shop for monitoring and controlling perimeter security equipment including but limited to, CCTV cameras, electronic door locks, motion sensors, IO boards ... etc. This is all achieved by agents where each agent specializes in one technology and connects to devices of that technology to source state updates, events and run commands forwarded by AWARE platform. Also, it is responsible for updating access control policies based on the master policies defined in AWARE.

## State, Events and Commands
The general mental model / abstraction of a device in AWARE deals with 3 concepts:
- State Updates: For each device, there is an object of certain shape that describes the current state of a device. Agents are expected to continuously emit those state updates once they're started
- Events: For each device, there are types of events that can take place and the agent's responsibility is to communicate those with low latency to AWARE adhering to the structure of these standard events per device type
- Commands: Depending on device type (camera, door ... etc), platform users can issues commands to run on devices. Those commands are executed by an agent responsible for that particular tehchnology / partner system.

## Access Control
Another area that an agent deals with is access control policies. Access control policies are about which person can access which resource at what time. Those access policies are defined in AWARE platform but they're distributed to partner systems via agents. When a user changes an access policy. Access control policies are stored and managed according to the following object model:
  - Persons: Persons are people who are expected to be relevant in a facility
  - Schedules: Weekly time tables that specify include time ranges. Typically, schedules are used by access rules to set when a collection of people can access a collection of resources (devices)
  - Access Rules: Each access rule contains info about which collection of people can access which collection of resources at certain time schedules
  - Zones: a zone is a non-overlapping physical grouping of resources

AWARE platform will propagate those changes to agents on two phases:
- Validation phase: AWARE will send a message mentioning all the changes (mutations) of access control objects. Mutations are either merges or deletes
- Apply Phase: Upon successful validation, the agent will be sent a message to apply the changes on the partner system. Applying the changes MUST be idempotent. That includes adding, updating or removing. Operations must always be able to recover if the partner system access objects have been manipulated outside AWARE platform. Taht includes cases like assigning a token to a person where the token has been assigned to someone else on the partner system, or update an object that no more exists in the partner system.
  
In both, validation and apply phases, the platform will send along all the reference translations for all objects mentioned in change descriptions. It is expected that the agent will inspect the shared references to makes sure they are still valid and to complain if there are objects that do not have needed references.



